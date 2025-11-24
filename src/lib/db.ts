import mysql from 'mysql2/promise';

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'market_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 쿼리 실행 헬퍼 함수
export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

// 연결 테스트 함수
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL 연결 성공!');
    connection.release();
    return true;
  } catch (error) {
    console.error('MySQL 연결 실패:', error);
    return false;
  }
}

export default pool;
