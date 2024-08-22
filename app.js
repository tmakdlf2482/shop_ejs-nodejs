const http = require('http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');

app.set('port', 3000);
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public')); // 외부에서 접근 가능

// POST 방식으로 파라미터 전달 받기 위한 설정
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// 쿠키 사용 미들웨어 설정
app.use(cookieParser());

// 세션 사용 미들웨어 설정
app.use(expressSession({
  secret: 'my key',
  resave: true,
  saveUninitialized: true,
}));

// 임시 데이터
const memberList = [
  {no: 101, id: 'user01', password: '1234', name: '홍길동', email: 'hong@gmail.com'},
  {no: 102, id: 'user02', password: '5678', name: '이순신', email: 'lee@gmail.com'},
  {no: 103, id: 'user03', password: '9101', name: '강감찬', email: 'kang@gmail.com'},
  {no: 104, id: 'user04', password: '1123', name: '유관순', email: 'you@gmail.com'},
];
let noCnt = 105;

// 쇼핑 상품 목록
const carList = [
  {_id: 111, name: 'SM5', price: 3000, year: 1999, company: 'SAMSUNG'},
  {_id: 112, name: 'SM7', price: 5000, year: 2013, company: 'SAMSUNG'},
  {_id: 113, name: 'SONATA', price: 3000, year: 2023, company: 'HYUNDAI'},
  {_id: 114, name: 'GRANDEUR', price: 4000, year: 2022, company: 'HYUNDAI'},
  {_id: 115, name: 'BMW', price: 6000, year: 2019, company: 'BMW'},
  {_id: 116, name: 'SONATA', price: 3200, year: 2024, company: 'HYUNDAI'},
];
let carSeq = 117;

const carCart = [];

// 요청 라우팅 사용
const router = express.Router();

// app.get('/home', (req, res) => {
router.route('/home').get((req, res) => {
  req.app.render('home/Home', {}, (err, html) => {
    res.end(html);
  });
});

// app.get('/profile', (req, res) => {
router.route('/profile').get((req, res) => {
  req.app.render('profile/Profile', {}, (err, html) => {
    res.end(html);
  });
});

// app.get('/member', (req, res) => {
router.route('/member').get((req, res) => {
  // 로그인이 되어 있다면 member 페이지를 보여준다.
  // 쿠키는 사용자쪽에 전달(res), 세션은 브라우저(사용자)에서 요청 들어올 때 생성(req)
  if (req.session.user !== undefined) {
    const user = req.session.user

    req.app.render('member/Member', {user}, (err, html) => {
      res.end(html);
    });
  }
  else {
    res.redirect('login');
  }
});

// app.get('/login', (req, res) => {
router.route('/login').get((req, res) => {
  req.app.render('member/Login', {}, (err, html) => {
    // 쿠키 설정
    res.cookie('user', { // 사용자(접속자)의 로컬에 쿠키가 저장된다.
      id: 'TestUser',
      name: '테스트 유저',
      authorized: true,
    });

    res.end(html);
  });
});

// app.post('/login', (req, res) => {
router.route('/login').post((req, res) => {
  // console.log(req.body.id, req.body.password);

  const idx = memberList.findIndex(member => member.id === req.body.id);

  if ( idx != -1) {
    if (memberList[idx].password === req.body.password) {
      console.log('로그인 성공!');
      // 세션에 로그인 정보를 등록 후 멤버 페이지 이동
      req.session.user = {
        id: req.body.id,
        name: memberList[idx].name,
        email: memberList[idx].email,
        no: memberList[idx].no,
      }
      res.redirect('/member');
    }
    else {
      console.log('로그인 실패! 패스워드가 맞지 않습니다.');
      // 다시 로그인 페이지로 이동
      res.redirect('login');
    }
  }
  else {
    console.log('존재하지 않는 계정입니다.');
    res.redirect('/login');
  }
});

router.route('/logout').get((req, res) => {
  console.log('GET - /logout 호출 ...');
  
  if (!req.session.user) {
    console.log('아직 로그인 전 상태입니다.');
    res.redirect('/login');
    return;
  }

  // 세션의 user 정보를 제거해서 logout 처리
  req.session.destroy((err) => {
    if (err) throw err;
    console.log('로그아웃 성공!');
    res.redirect('/login');
  });
});

// app.get('/joinus', (req, res) => {
router.route('/joinus').get((req, res) => {
  // 회원가입 ejs 페이지 forward
  req.app.render('member/Joinus', {}, (err, html) => {
    res.end(html);
  });
});

// app.post('/joinus', (req, res) => {
router.route('/joinus').post((req, res) => {
  // 회원 가입 처리 후 목록으로 갱신
  res.redirect('/member');
});

// app.get('/gallery', (req, res) => {
router.route('/gallery').get((req, res) => {
  req.app.render('gallery/Gallery', {}, (err, html) => {
    res.end(html);
  });
});

// ---- 쇼핑몰 기능
// app.get('/shop', (req, res) => {
router.route('/shop').get((req, res) => {
  req.app.render('shop/Shop', {carList}, (err, html) => {
    if(err) throw err;
    res.end(html);
  });
});

router.route('/shop/insert').get((req, res) => {
  req.app.render('shop/Insert', {id: carSeq}, (err, html) => {
    res.end(html);
  });
});

router.route('/shop/insert').post((req, res) => {
  carList.push({_id: carSeq++, name: req.body.name, price: req.body.price, year: req.body.year, company: req.body.company});

  req.app.render('shop/Shop', {carList}, (err, html) => {
    res.end(html);
  });
});

router.route('/shop/modify').get((req, res) => {
  const _id = parseInt(req.query._id); // 쿼리로 전송된 데이터는 모두 문자열이다.

  const idx = carList.findIndex(car => car._id === _id);

  if (idx === -1) {
    console.log('상품이 존재하지 않습니다.');
    res.redirect('/shop');
    return;
  }

  req.app.render('shop/Modify', {car: carList[idx]}, (err, html) => {
    if (err) throw err;
    res.end(html);
  });
});

router.route('/shop/modify').post((req, res) => {
  const _id = parseInt(req.body._id);

  const idx = carList.findIndex(car => car._id === _id);

  if (idx !== -1) {
    carList[idx].name = req.body.name;
    carList[idx].price = req.body.price;
    carList[idx].year = req.body.year;
    carList[idx].company = req.body.company;
  }

  req.app.render('shop/Shop', {carList}, (err, html) => {
    if (err) throw err;
    res.end(html);
  });
});

router.route('/shop/detail').get((req, res) => {
  const _id = parseInt(req.query._id); // 쿼리로 전송된 데이터는 모두 문자열이다.

  const idx = carList.findIndex(car => car._id === _id);

  if (idx === -1) {
    console.log('상품이 존재하지 않습니다.');
    res.redirect('/shop');
    return;
  }

  req.app.render('shop/Detail', {car: carList[idx]}, (err, html) => {
    if (err) throw err;
    res.end(html);
  });
});

router.route('/shop/delete').get((req, res) => {
  const _id = parseInt(req.query._id); // 쿼리로 전송된 데이터는 모두 문자열이다.

  const idx = carList.findIndex(car => car._id === _id);

  if (idx !== -1) {
    carList.splice(idx, 1);
  }

  req.app.render('shop/Shop', {carList}, (err, html) => {
    res.end(html);
  });
});

router.route('/shop/cart').get((req, res) => {
  req.app.render('shop/Cart', {carCart}, (err, html) => {
    res.end(html);
  });
});

router.route('/shop/cart').post((req, res) => {
  const _id = parseInt(req.body._id); // 쿼리로 전송된 데이터는 모두 문자열이다.

  const idx = carList.findIndex(car => car._id === _id);

  // 장바구니 목록에 중복 추가 방지
  const idx2 = carCart.findIndex(car => car._id === carList[idx]._id);

  if (idx2 !== -1) {
    console.log('이미 장바구니에 추가된 상품입니다.');
    res.redirect('/shop');
    return;
  }
  
  carCart.push({_id: carList[idx]._id, name: carList[idx].name, price: carList[idx].price, year: carList[idx].year, company: carList[idx].company});

  req.app.render('shop/Cart', {carCart}, (err, html) => {
    res.end(html);
  });
});

// 설정 가장 아래에 미들웨어를 등록
app.use('/', router);

// 등록되지 않은 패스에 대해 페이지 오류 응답
// app.all('*', function(req, res) {
//   res.status(404).send('<h1>ERROR - 페이지를 찾을 수 없습니다.</h1>');
// });

const expressErrorHandler = require('express-error-handler');
const { compile } = require('ejs');
// 모든 라우터 처리 후 404 오류 페이지 처리
const errorHandler = expressErrorHandler({
  static: {
    '404': './public/404.html'
  }
});
app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

// 서버 생성 및 실행
const server = http.createServer(app); // http와 express를 같은 포트로 사용 가능
server.listen(app.get('port'), () => {
  console.log(`server start >>> http://localhost:${app.get('port')}`);
});