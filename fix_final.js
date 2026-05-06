const fs = require('fs');
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>?怨뺚봺筌??硫명닊</title>
    <link rel="icon" type="image/png" href="favicon.png">
    <link rel="apple-touch-icon" href="favicon.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0f172a;
            color: white;
            font-family: -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
        }
        .logo { width: 80px; height: 80px; margin-bottom: 20px; border-radius: 16px; }
        .spinner { border: 4px solid rgba(255,255,255,0.1); border-left-color: #f59e0b; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn { background: #f59e0b; color: #0f172a; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 20px; display: inline-block; }
    </style>
</head>
<body>
    <img src="favicon.png" class="logo">
    <div style="font-size: 24px; font-weight: bold;">?怨뺚봺筌??硫명닊</div>
    <div class="spinner"></div>
    <div id="msg">?源놁뱽 ?븍뜄???삳뮉 餓λ쵐???덈뼄...</div>
    <a href="#" class="btn">MyHomeTax 獄쏅뗀以덂첎?疫?/a>
</body>
</html>`;
fs.writeFileSync('index.html', html, 'utf8');
