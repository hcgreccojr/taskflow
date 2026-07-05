import { request } from './httpClient';
import type { User } from '../shared/types/api';

export function getMe(): Promise<User> {
  return request('/users/me');
}
