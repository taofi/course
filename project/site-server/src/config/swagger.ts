import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const swaggerDocument = yaml.load(fs.readFileSync(path.join(__dirname, '../swagger/authSwagger.yaml'), 'utf8')) as object;

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};