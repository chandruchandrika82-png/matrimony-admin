import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import App from '../App';
import MemberPrint, { printValue } from './MemberPrint';
import { LanguageProvider } from '../Language';
import api from '../services/api';
import fs from 'fs';
import path from 'path';

jest.mock('../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }, API_URL: 'https://example.com/api' }));
beforeAll(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open',''); }; });
beforeEach(() => { localStorage.clear(); window.history.replaceState({}, '', '/members'); jest.clearAllMocks(); });
afterEach(() => { jest.restoreAllMocks(); });
const rows = [
  { _id:'internal-alpha', name:'Fictional Alpha', age:29, gender:'Female', currentCity:'Namakkal', education:'Graduate', caste:'Kongu', religion:'Hindu', fatherName:'Fictional Parent', star:'Rohini', image:'https://example.com/photo.jpg', password:'secret-password', token:'secret-token', nestedSecret:{x:1} },
  { _id:'internal-beta', name:'Fictional Beta', age:0, brothersCount:0 },
];
function start(members = rows) { localStorage.setItem('adminToken','synthetic-test-only'); api.get.mockResolvedValue({data:members}); render(<App/>); }
test('every member on both pagination pages has print and existing actions', async () => {
  start(Array.from({length:11},(_,i)=>({...rows[0],_id:`internal-${i}`,name:`Fictional Member ${i}`})));
  await screen.findByText('Fictional Member 0');
  expect(screen.getAllByRole('button',{name:/^Print profile /})).toHaveLength(10);
  for(const card of screen.getAllByRole('article')) {
    for(const action of ['Print profile','View','Edit member','Delete member']) expect(within(card).getByRole('button',{name:new RegExp(`^${action} `)})).toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole('button',{name:'Next page'}));
  expect(screen.getByRole('button',{name:'Print profile Fictional Member 10'})).toBeInTheDocument();
});
test('print view contains only the selected member and no credentials/internal IDs; native print is invoked without API writes', async () => {
  const print=jest.spyOn(window,'print').mockImplementation(()=>{});
  start();await screen.findByText('Fictional Beta');
  fireEvent.click(screen.getByRole('button',{name:'Print profile Fictional Beta'}));
  const dialog=screen.getByRole('dialog',{name:'Print profile'});
  expect(within(dialog).getByRole('heading',{name:'Fictional Beta'})).toBeInTheDocument();
  expect(dialog).not.toHaveTextContent('Fictional Alpha');
  expect(dialog).not.toHaveTextContent('internal-beta');expect(dialog).not.toHaveTextContent('secret-token');
  expect(within(dialog).getByText('Age')).toBeInTheDocument();
  expect(within(dialog).getByText('No photo')).toBeInTheDocument();
  expect(within(dialog).getAllByText('Not provided').length).toBeGreaterThan(0);
  expect(within(dialog).getByRole('heading',{name:'New Varan Kongu Thirumana Matrimony'})).toBeInTheDocument();
  dialog.querySelectorAll('img').forEach(image => Object.defineProperty(image, 'complete', { value: true }));
  const button=within(dialog).getByRole('button',{name:'Print / Save as PDF'});
  fireEvent.click(button);fireEvent.click(button);await waitFor(()=>expect(print).toHaveBeenCalledTimes(1));
  expect(api.get).toHaveBeenCalledTimes(1);expect(api.post).not.toHaveBeenCalled();expect(api.put).not.toHaveBeenCalled();expect(api.delete).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button',{name:'Close'}));expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(document.body).not.toHaveClass('member-print-active');
});

test('print header uses the default company identity', async () => {
  start();
  await screen.findByText('Fictional Alpha');
  fireEvent.click(screen.getByRole('button', { name: 'Print profile Fictional Beta' }));
  const dialog = screen.getByRole('dialog', { name: 'Print profile' });
  expect(within(dialog).getByText('New Varan Kongu Thirumana Matrimony')).toBeInTheDocument();
  expect(within(dialog).getByText('Namakkal')).toBeInTheDocument();
  expect(within(dialog).getByText('Phone: 9344973982')).toBeInTheDocument();
});
test('print allowlist includes existing family/horoscope data and escapes long content', async () => {
  start([{...rows[0], expectations:'<script>not-code</script> '+ 'Long fictional text '.repeat(200), companyName:'Fictional Company', annualIncome:0}]);
  await screen.findByText('Fictional Alpha');fireEvent.click(screen.getByRole('button',{name:'Print profile Fictional Alpha'}));
  const dialog=screen.getByRole('dialog');
  for(const text of ['Fictional Parent','Rohini','Graduate','Kongu','Fictional Company']) expect(within(dialog).getByText(text)).toBeInTheDocument();
  for(const secret of ['internal-alpha','secret-password','secret-token','nestedSecret']) expect(dialog).not.toHaveTextContent(secret);
  expect(dialog.querySelector('script')).toBeNull();expect(dialog).toHaveTextContent('<script>not-code</script>');
  const photo=within(dialog).getByRole('img',{name:'Main photo'});fireEvent.error(photo);expect(within(dialog).queryByRole('img',{name:'Main photo'})).not.toBeInTheDocument();
});
test('hidden photos and contact/income/company fields never leak through print markup', async () => {
  start([{...rows[0],hidePhotos:true,hideMobile:'true',hideCompany:true,hideIncome:true,mobile:'hidden-mobile',companyName:'hidden-company',annualIncome:'hidden-income',profilePhotos:['https://example.com/private.jpg']}]);
  await screen.findByText('Fictional Alpha');fireEvent.click(screen.getByRole('button',{name:'Print profile Fictional Alpha'}));
  const dialog=screen.getByRole('dialog');
  expect(within(dialog).getAllByRole('img')).toHaveLength(1); // original logo only
  for(const text of ['hidden-mobile','hidden-company','hidden-income','https://example.com/private.jpg','https://example.com/photo.jpg']) expect(dialog.innerHTML).not.toContain(text);
  expect(within(dialog).getByText('Name')).toBeInTheDocument();
});
test('no unauthenticated print view or native dialog', () => {
  const print=jest.spyOn(window,'print').mockImplementation(()=>{});const close=jest.fn();
  render(<LanguageProvider><MemberPrint member={rows[0]} close={close}/></LanguageProvider>);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(print).not.toHaveBeenCalled();
});
test('missing and object values are safe, numeric zero and booleans are intentional',()=>{
  const t=x=>x; expect(printValue({age:0},'age',t)).toBe('0');expect(printValue({hidePhotos:false},'hidePhotos',t)).toBe('No');
  expect(printValue({education:{}},'education',t)).toBe('Not provided');expect(printValue({education:'   '},'education',t)).toBe('Not provided');
});
test('print stylesheet defines A4, isolates selected content and permits long sections to paginate',()=>{
  const css=fs.readFileSync(path.join(process.cwd(),'src/components/MemberPrint.css'),'utf8');
  expect(css).toContain('size: A4 portrait');expect(css).toContain('@media print');expect(css).toContain('body.member-print-active > *:not(.member-print-dialog)');
  expect(css).toContain('.member-print-toolbar { display: none');expect(css).toContain('break-inside: auto');expect(css).toContain('break-after: avoid');expect(css).toContain('overflow-wrap: anywhere');
});


test("compact print layout uses one ordered page without omitting requested fields", async () => {
  start(); await screen.findByText("Fictional Alpha");
  fireEvent.click(screen.getByRole("button", {name: "Print profile Fictional Alpha"}));
  const dialog=screen.getByRole("dialog");
  const pages=dialog.querySelectorAll(".member-print-page");
  expect(pages).toHaveLength(1);
  expect(within(pages[0]).getByRole("heading",{name:"Profile details"})).toBeInTheDocument();
  expect(within(pages[0]).getByRole("heading",{name:"Horoscope"})).toBeInTheDocument();
  expect(dialog.querySelectorAll(".member-print-field").length).toBeGreaterThan(25);
});

test("printed dialog fills printable width instead of shrink-wrapping the columns",()=>{ const css=fs.readFileSync(path.join(process.cwd(),"src/components/MemberPrint.css"),"utf8"); expect(css).toContain("width: 100% !important; max-width: 100% !important; box-sizing: border-box !important"); expect(css).toContain(".member-print-document { width: 100%; box-sizing: border-box;"); });

test("printed columns contain the requested profile boxes", async()=>{start();await screen.findByText("Fictional Alpha");fireEvent.click(screen.getByRole("button",{name:"Print profile Fictional Alpha"}));const dialog=screen.getByRole("dialog");const left=dialog.querySelector('[data-print-column="personal-family"]'), right=dialog.querySelector('[data-print-column="career-religion"]');expect(within(left).getByRole("heading",{name:"Profile details"})).toBeInTheDocument();expect(within(left).getByRole("heading",{name:"Family details"})).toBeInTheDocument();expect(within(right).getByRole("heading",{name:"Kulam details"})).toBeInTheDocument();expect(within(right).getByRole("heading",{name:"Horoscope"})).toBeInTheDocument();});
