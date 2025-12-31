// Empty module for browser builds - replaces Node.js-only modules
export default {};
export const readFileSync = () => '';
export const writeFileSync = () => {};
export const existsSync = () => false;
export const readdirSync = () => [];
export const statSync = () => ({});
export const join = (...args) => args.join('/');
export const resolve = (...args) => args.join('/');
export const dirname = (p) => p.split('/').slice(0, -1).join('/');
export const basename = (p) => p.split('/').pop();
