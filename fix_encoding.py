content = '''<!DOCTYPE html>
<html>
<head>
  <base href="/MyHomeTax/">
  <meta charset="UTF-8">
  <meta content="IE=Edge" http-equiv="X-UA-Compatible">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="apple-mobile-web-app-title" content="&#50864;&#47532;&#51665; &#49464;&#44552;">
  <link rel="apple-touch-icon" href="favicon.png">
  <link rel="icon" type="image/png" href="favicon.png"/>
  <title>&#50864;&#47532;&#51665; &#49464;&#44552;</title>
  <link rel="manifest" href="manifest.json">
</head>
<body style="background-color: #111827;">
  <script src="flutter_bootstrap.js" async></script>
</body>
</html>'''
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
