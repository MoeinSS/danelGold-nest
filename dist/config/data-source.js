"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _dotenv = require("dotenv");
const _typeorm = require("typeorm");
(0, _dotenv.configDotenv)({
    path: '.env'
});
console.log('Database Host:', process.env.PG_HOST);
console.log('Postgres Port:', process.env.PORT_PG_DB);
console.log('Database:', process.env.DATABASE_PG_DB);
console.log('Username:', process.env.USERNAME_PG_DB);
console.log('Password:', process.env.PASSWORD_PG_DB);
const datasource = new _typeorm.DataSource({
    type: 'postgres',
    host: process.env.PG_HOST,
    port: parseInt(process.env.PORT_PG_DB, 10),
    database: process.env.DATABASE_PG_DB,
    username: process.env.USERNAME_PG_DB,
    password: process.env.PASSWORD_PG_DB,
    entities: [
        __dirname + '**/**/**/**.entity{.ts,.js}'
    ],
    migrations: [
        __dirname + '/@migrations/*{.ts,.js}'
    ],
    logging: false,
    synchronize: true,
    cache: false
});
const _default = datasource;

//# sourceMappingURL=data-source.js.map