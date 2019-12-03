import request from '@/utils/request'

export function fetchList(query) {
  return request({
    url: '/api/articles',
    method: 'get',
    params: query
  })
}

export function fetchArticle(id) {
  return request({
    url: `/api/articles/${id}`,
    method: 'get'
  })
}

export function createArticle(data) {
  return request({
    url: '/api/articles',
    method: 'post',
    data
  })
}

export function updateArticle(id, data) {
  return request({
    url: `/api/articles/${id}`,
    method: 'put',
    data
  })
}

export function deleteArticle(id) {
  return request({
    url: `/api/articles/${id}`,
    method: 'delete'
  })
}
