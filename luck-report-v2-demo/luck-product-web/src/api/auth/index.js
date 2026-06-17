import request from '@/utils/request';
import qs from 'qs';

export function login(data) {
    return request.post('/auth/login', qs.stringify(data),{
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    })
}

export function logout() {
    return request.post('/auth/logout')
}
