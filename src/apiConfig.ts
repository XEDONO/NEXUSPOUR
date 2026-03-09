// Change this to your production URL when you deploy
const IS_PRODUCTION = true;

export const API_BASE_URL = IS_PRODUCTION
    ? 'https://www.aromatik.store/api'
    : 'http://localhost:3001/api';
