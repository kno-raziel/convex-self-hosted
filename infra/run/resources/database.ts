import { INSTANCE_NAME } from './shared'
import { vpc } from './shared'

export const database = new sst.aws.Mysql('Database', {
  vpc,
  database: INSTANCE_NAME.value,
  dev: {
    database: INSTANCE_NAME.value,
    password: 'root',
    host: 'localhost',
    username: 'root',
    port: 3306,
  },
})
