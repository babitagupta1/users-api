
import { InMemoryRepository } from './in-memory.repository.js';

const FIELD_MAP = {
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  phone: 'phone',
  dateOfBirth: 'date_of_birth',
  address: 'address',
  role: 'role',
  passwordHash: 'password_hash',
  githubId: 'github_id',
  avatar: 'avatar',
};

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth instanceof Date
      ? row.date_of_birth.toISOString().slice(0, 10)
      : row.date_of_birth,
    address: row.address,
    role: row.role,
    passwordHash: row.password_hash,
    githubId: row.github_id,
    avatar: row.avatar,
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at,
    updatedAt: row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : row.updated_at,
  };
}

export class UsersRepository extends InMemoryRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findAll() {
    if (!this.pool) return super.findAll();

    const result = await this.pool.query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );

    return result.rows.map(mapUser);
  }

  async findById(id) {
    if (!this.pool) return super.findById(id);

    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return mapUser(result.rows[0]);
  }

  async findByEmail(email) {
    if (!this.pool) {
      return super.findOne(
        (user) => user.email === email.toLowerCase()
      );
    }

    const result = await this.pool.query(
      'SELECT * FROM users WHERE lower(email) = lower($1)',
      [email]
    );

    return mapUser(result.rows[0]);
  }

  async findByGithubId(githubId) {
    if (!this.pool) {
      return super.findOne((user) => user.githubId === githubId);
    }

    const result = await this.pool.query(
      'SELECT * FROM users WHERE github_id = $1',
      [githubId]
    );

    return mapUser(result.rows[0]);
  }

  async create(data) {
    if (!this.pool) return super.create(data);

    const fields = Object.keys(FIELD_MAP).filter(
      (field) => data[field] !== undefined
    );

    const columns = fields.map((field) => FIELD_MAP[field]);
    const values = fields.map((field) => data[field]);
    const placeholders = fields.map(
      (_, index) => `$${index + 1}`
    );

    const result = await this.pool.query(
      `INSERT INTO users (${columns.join(', ')})
       VALUES (${placeholders.join(', ')})
       RETURNING *`,
      values
    );

    return mapUser(result.rows[0]);
  }

  async update(id, changes) {
    if (!this.pool) return super.update(id, changes);

    const fields = Object.keys(FIELD_MAP).filter(
      (field) => changes[field] !== undefined
    );

    if (fields.length === 0) return this.findById(id);

    const assignments = fields.map(
      (field, index) => `${FIELD_MAP[field]} = $${index + 2}`
    );

    const values = fields.map((field) => changes[field]);

    const result = await this.pool.query(
      `UPDATE users
       SET ${assignments.join(', ')}, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, ...values]
    );

    return mapUser(result.rows[0]);
  }

  async delete(id) {
    if (!this.pool) return super.delete(id);

    const result = await this.pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rowCount > 0;
  }
}
