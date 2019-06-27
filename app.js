const http = require('http');
const url = require('url');
const fs = require('fs');
const ejs = require('ejs');
const formidable = require('formidable');
const timeStamp = require('time-stamp');
const path = require('path');
let users = [];
const majors = require('./data/major.json');
const querystring = require('querystring');

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-type': 'text/html;charset=utf-8' });
    let urlObj = url.parse(req.url, true);
    //路由
    if (urlObj.pathname === '/') {
        send('/views/list.ejs').then(data => {
            let result = ejs.render(data.toString(), { users: users })
            res.end(result);
            return;
        });
    } else if (urlObj.pathname.endsWith('.css')) {
        res.writeHead(200, { 'Content-type': 'text/css;charset=utf-8' });
        send(urlObj.pathname).then((data) => res.end(data));
    } else if (urlObj.pathname === '/editor.html') {
        let usernumber = urlObj.query.usernumber;//修改学员学号

        let user = {};
        if (usernumber) {
            //数据回填，在数组中修改学员信息
            user = users.find((value) => {
                return value.usernumber == usernumber;
            })
        }
        // console.log(user);

        send('/views/editor.ejs').then((data) => {
            let result = ejs.render(data.toString(), { majors: majors, user: user })
            res.end(result);
        });
    } else if (urlObj.pathname === '/editor.do' && req.method === 'POST') {
        let form = new formidable.IncomingForm();
        form.uploadDir = './upload';
        form.parse(req, (error, fields, files) => {
            let photo = '';
            if (files.userphoto) {
                let time = timeStamp('YYYYMMDDHHmmss');
                let random = Math.ceil(Math.random() * 9000) + 1000;
                let extname = path.extname(files.userphoto.name);//.jpg
                let newName = time + random + extname;//拼好新名字
                let oldPath = __dirname + '/' + files.userphoto.path;//旧路径
                let newPath = __dirname + '/upload/' + newName;//新路径
                photo='/upload/'+newName;
                fs.renameSync(oldPath, newPath);
            }
            fields['userphoto']=photo;
            if (!isNaN(fields.usernumber)) {
                //修改学员
                users = users.map((value) => {
                    if (fields.usernumber == value.usernumber) {
                        if(fields.userphoto===''){
                            fields.userphoto=value.userphoto;                           
                        }
                        return fields;
                    }
                    return value;
                })
            } else {
                //新增学员
                let usernumber = 1;
                if (users.length> 0) {
                    usernumber = parseInt(users[users.length - 1].usernumber) + 1;
                }
                fields['usernumber']=usernumber;
                users.push(fields);

            }
            res.end('success')
        }) 
    } else if(urlObj.pathname==='/delete.do' && req.method==='POST'){
        let usernumber='';
        req.on('data',function(chunk){
            usernumber+=chunk;
        })
        req.on('end',function(){
            if(/^\d+$/.test(usernumber)){
                for(let i=0;i<users.length;i++){
                    if(users[i].usernumber==usernumber){
                        if(users[i].userphoto){
                            fs.unlinkSync('./'+users[i].userphoto)
                        }
                        users.splice(i,1)
                        res.end('success');
                    }
                }
            }else{
                res.end('error[usernumber is not a Number]')
            }
        })
    }
else {
    send(urlObj.pathname).then((data) => res.end(data));
}
    
}).listen(3000);
function send(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(__dirname + path, function (error, data) {
            if (error) {
                throw Error(error);
            }
            resolve(data);
        })
    })

}
function deleteOne(path){

}
console.log('student manage startup on port 3000');