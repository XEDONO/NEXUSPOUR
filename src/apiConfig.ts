const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const API_BASE_URL = IS_PRODUCTION
    ? '/php_server'
    : 'http://localhost/nexuspour/php_server';
