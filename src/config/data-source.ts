import { configDotenv } from 'dotenv';
import { DataSource } from 'typeorm';

configDotenv({ path: '.env' });

console.log('Database Host:', process.env.PG_HOST);
console.log('Postgres Port:', process.env.PORT_PG_DB);
console.log('Database:', process.env.DATABASE_PG_DB);
console.log('Username:', process.env.USERNAME_PG_DB);
console.log('Password:', process.env.PASSWORD_PG_DB);

const datasource = new DataSource({
  type: 'postgres',
  host: process.env.PG_HOST,
  port: parseInt(process.env.PORT_PG_DB, 10),
  database: process.env.DATABASE_PG_DB,
  username: process.env.USERNAME_PG_DB,
  password: process.env.PASSWORD_PG_DB,
  entities: [__dirname + '**/**/**/**.entity{.ts,.js}'],
  migrations: [__dirname + '/@migrations/*{.ts,.js}'],
  logging: false,
  synchronize: true,
  cache: false,
});

export default datasource;