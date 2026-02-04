import { CorsOptions } from 'cors';

const allowedOrigins: string[] = [
  'http://localhost:5173', // Пример для локальной разработки
  'http://192.168.0.104:5173', 
  'http://localhost:9000',
  
];

/**
 */
const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true); 
    } else {
      callback(new Error(`Not allowed by CORS policy for origin: ${origin}`));
    }
  },

  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',

  allowedHeaders: 'Content-Type,Authorization',

  credentials: true,
};

export default corsConfig;