const config = {
  "*.{js,mjs,cjs,ts,tsx}": ["prettier --write", "eslint --max-warnings=0"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"],
};

export default config;
