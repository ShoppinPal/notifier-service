import url from 'url';
// Todo: Authenticate userId/OrganizationId
let isAuthentic = (urlWithToken) => {
        return new Promise((resolve, reject) => {
                let queryData = url.parse(urlWithToken, true).query;
                return queryData.token ? resolve() : reject();
        });
}

let isUserValid = (userId) => {
        return new Promise((resolve, reject) => {
                return userId ? resolve() : reject();
        });
}


export {isAuthentic, isUserValid};