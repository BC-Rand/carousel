export interface PicResponse {
    author: string
    author_url: string
    filename: string
    format: string
    height: number
    id: number
    post_url: string
    width: number
    mapped: boolean
}

export interface AuthorMap {
    [key:string]: number 
}