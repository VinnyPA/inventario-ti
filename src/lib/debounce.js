// src/lib/debounce.js
export const debounce = (fn, ms = 200) => {
let t;
return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
};
};
