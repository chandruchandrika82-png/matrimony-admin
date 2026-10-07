import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useLanguage } from "../Language";

export default function BackButton({ fallback = "/" }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = (window.history.state?.idx || 0) > 0;
  const disabled = !canGoBack && (!fallback || location.pathname === fallback);

  function goBack() {
    if (canGoBack) navigate(-1);
    else if (!disabled) navigate(fallback, { replace: true });
  }

  return <button type="button" className="icon-button page-back" aria-label={t("Go back")} title={t("Go back")} disabled={disabled} onClick={goBack}><FiArrowLeft /></button>;
}
