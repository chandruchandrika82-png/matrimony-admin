import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../App';
import api from '../services/api';
jest.mock('../services/api',()=>({__esModule:true, default:{get:jest.fn(),put:jest.fn(),post:jest.fn(),delete:jest.fn()}}));
beforeAll(()=>{HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};});
beforeEach(()=>{localStorage.clear();localStorage.setItem('adminToken','fictional');window.history.replaceState({},'', '/interests');jest.clearAllMocks();});
test('read-only interests page filters statuses and opens the correct member',async()=>{
 api.get.mockResolvedValue({data:[{_id:'a',name:'Fictional Anu'},{_id:'b',name:'Fictional Bala',interestRequests:['a']},{_id:'c',name:'Fictional Devi',acceptedRequests:['b']}]});
 render(<App/>);await screen.findByRole('button',{name:'Fictional Anu'});
 expect(screen.getAllByRole('article')).toHaveLength(2);
 fireEvent.change(screen.getByRole('combobox',{name:'Interest status'}),{target:{value:'Accepted'}});
 expect(screen.getAllByRole('article')).toHaveLength(1);
 fireEvent.click(within(screen.getByRole('article')).getByRole('button',{name:'Fictional Devi'}));
 expect(screen.getByRole('dialog')).toHaveTextContent('Fictional Devi');
 expect(api.get).toHaveBeenCalledWith('/users');expect(api.put).not.toHaveBeenCalled();expect(api.post).not.toHaveBeenCalled();expect(api.delete).not.toHaveBeenCalled();
});
test('search and empty state',async()=>{
 api.get.mockResolvedValue({data:[{_id:'a',name:'One'},{_id:'b',name:'Two',interestRequests:['a']}]});render(<App/>);await screen.findByRole('button',{name:'One'});
 fireEvent.change(screen.getByRole('textbox',{name:'Search interests'}),{target:{value:'unknown'}});
 expect(screen.getByText('No interest requests found.')).toBeInTheDocument();
});
