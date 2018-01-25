module.exports = function () {
	return {
		OK : 			200,
		UNAUTHORIZED: 	401,
		FORBIDDEN: 		403,
		INTERNAL_ERROR: 500,
		CONFLICT: 		409,

		LOGIN_URL: 		'/login',
		CHECK_AUTHENTICATION: '/auth',
		GET_NODES:    '/nodes',
		SAVE_NODE:    '/nodes/save',
		DELETE_NODE:   '/nodes/delete',
		GET_ARTICLE: '/articles/get',
		GET_ARTICLE_CONTENT: '/articles/content/get',
		SAVE_ARTICLE_CONTENT: '/articles/content/save',
		CREATE_ARTICLE: '/articles/create',
		UPDATE_ARTICLE: '/articles/update',

		UPLOAD_URL: '/singleUpload',
		GET_FILES_FOR_USER_URL: '/files/user',
		GET_FILES_FOR_BOARD_URL: '/files/board',

		INVALID_TOKEN: new Error('INVALID_TOKEN'),
		UNKNOWN_USER: new Error('UNKNOWN_USER'),
		INCOMPLETE_DATA: new Error('INCOMPLETE_DATA'),
		BAD_DATA: new Error('BAD_DATA'),

		LOCAL: {
			FRONTEND_ROOT_URL: 'http://localhost:4200',
			UPLOAD_DIR_BASE: 'C:/Uploads/'
		},
		PROD: {
			FRONTEND_ROOT_URL: 'http://34.244.36.79:4200',
			UPLOAD_DIR_BASE: '/root/Uploads/'
		}
	}
};