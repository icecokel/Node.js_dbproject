/* mysql 연동을 지원하는 웹서버를 구축하자!!*/
var http = require("http"); // 내장 모듈
var mysql = require("mysql"); // 외부 모듈을 받아옴. // npm install mysql // 최신버전으로 받아짐. 버전 지정하고싶으면 mysql@12313.12321
var querystring = require("querystring"); // post 파라미터 처리 모듈
var fs = require("fs");
// node.js 모듈 중  jps, php, asp 와 같은 서버에서만 해석 및 실행되는 스크립트 기술이 지원된다..
// 이를 지원하는 모듈이 ejs 모듈이다.
var ejs = require("ejs");
// mysql 접속정보
var url = require("url"); // resolution

const conStr = {
    url: "localhost:3306",
    database: "ios",
    user: "root",
    password: "1234"
}


var server = http.createServer(function (req, res) {

    console.log("클라언트의 요청 URL :", req.url);
    // request.url의 문제점 ? url에 대한 이해를 하지 못하고, 단순 문자열 비교를 하려고한다..
    // 따라서 파라미터가 포함되었을떄 전체를 문자열로 이해해버림

    const path = url.parse(req.url).pathname;

    
    // mysql에 인서트하기
    switch (path) {
        case "/hero/join": joinform(res); break;
        case "/hero/insert": insert(req, res); break;
        case "/hero/list": selectAll(req, res); break;
        case "/hero/select": select(req, res); break;
        case "/hero/update": update(req, res); break;
        case "/hero/delete": remove(req, res); break;
    }



});
// 등록 폼 요청에 대한 처리
function joinform(res){

    fs.readFile("join.html","utf8",function(err,data){
        res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        res.end(data);
    });


}
//등록하기
function insert(req, res) {
    // 입력양식으로 전송될 예정이므로, post로 전송 된다는 가정
    // node.js 에서 post 로 전송될떄는 querystring 모듈을 사용할꺼임.
    // post방식은 까다로움.
    // request객체의 on 이벤트 핸들러로 데이터를 전송된 시점에 처리해야한다.

    var content = "";
    // 변수에 데이터를 모아두자.
    req.on("data", function (data) {
        content += data;
        var json = querystring.parse(content) // 요청정보를 넣음.
        console.log(json);

        var sql = "insert into hero(name,gender,age) values(?,?,?)";


        var client = mysql.createConnection(conStr);
        client.query(sql,[json.name,json.gender,json.age], function (err, fields) {
            var result;
            if (err) {
                console.log("insert 실패");
                console.log(err);
                result = {
                    code:0,
                    msg:"등록실패"
                }
            } else {
                console.log("insert 성공");
                result = {
                    code:0,
                    msg:"등록성공"
                }
            }

            res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
            res.end(JSON.stringify(result));

            
        });

    });
}
//목록가져오기
function selectAll(req, res) {

    var client = mysql.createConnection(conStr)
    const sql = "select * from hero order by hero_id asc"

    client.query(sql, function(err, result ,fields){
        if(err){
            console.log("error");
            console.log(err);
        }else{
            console.log(result);

            res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                fs.readFile("list.ejs","utf-8",function(err,data){

                res.end(ejs.render(data,{
                    "record" : result
                }));
            });

        }

    });
}
//한건 가져오기
function select(req, res) {
    var client = mysql.createConnection(conStr);
    var sql = "select * from hero where hero_id=?";

    // 요청 객체로 부터 get방식으로 전송된 파라미터 추출하기!!
    // json으로 받기 위해서 url 객체가 필요함.
    var urlObj = url.parse(req.url , true); // true 을 주면 JSON으로 반환해줌
    var json = urlObj.query;
    console.log("클라이언트가 전송한 hero_id : ", json.hero_id);

    client.query(sql,[json.hero_id],function(err,result,fields){
        console.log(result);
        
        res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        fs.readFile("detail.ejs","utf-8",function(err,data){
            res.end(ejs.render(data, {
                "record" : result[0] // result에 한건만 들어있지만 배열이므로 0번 데이터를 보내준다.
            }));
        })
       

    });


}
//수정하기
function update(req, res) {
    var content = "";

    

    req.on("data", function(data){
        content += data
        var json = querystring.parse(content);
        console.log(json.name)
        console.log(json.gender)
        console.log(json.age)

        const client = mysql.createConnection(conStr);
        const sql = "update hero set name=? ,gender =? ,age=? where hero_id = ?";
        
        client.query(sql,[json.name , json.gender , json.age , json.hero_id], function(err,fields){
            if(err){
                console.log("수정실패");
            }else{
                console.log("수정성공");

            }
        })

    })
}

//삭제하기
function remove(req, res) {

    var urlObj = url.parse(req.url , true); // true 을 주면 JSON으로 반환해줌
    var json = urlObj.query;
    var hero_id = json.hero_id;

    var client = mysql.createConnection(conStr);
    var sql = "delete from hero where hero_id=?";

    client.query(sql,[hero_id ],function(err,fields){
        if(err){
            console.log("삭제실패");
        }else{
            res.writeHead(301, {"Location":"/hero/list"});
            res.end("삭제완료");
        }
    })


}


server.listen(7777, function () {

    console.log("The server is running at 7777 port....")

});