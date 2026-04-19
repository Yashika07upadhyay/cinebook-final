import { useState, useCallback, useEffect } from "react";

let toastId = 0;

// Global toast store
let addToastFn = null;
export const toast = {
  success: (msg) => addToastFn?.({ msg, type: "success" }),
  error: (msg) => addToastFn?.({ msg, type: "error" }),
  info: (msg) => addToastFn?.({ msg, type: "info" }),
};

const Toast = ({ id, msg, type, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 3500);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return <div className={`toast ${type}`}>{msg}</div>;
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const add = useCallback(({ msg, type }) => {
    const id = ++toastId;
    setToasts(t => [...t, { id, msg, type }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  addToastFn = add;

  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onRemove={remove} />
      ))}
    </div>
  );
};
