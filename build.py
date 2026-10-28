import os
TEL='04-2255-6578';TELJP='010-886-4-2255-6578';LINE='vashwugo';MAIL='info@thefun.com.tw'
LINEURL='https://line.me/ti/p/~vashwugo'
NAV_JA=[('index.html','TOP','トップ'),('properties.html','PROPERTY','物件情報'),('flow.html','FLOW','入居までの流れ'),('knowledge.html','KNOWLEDGE','台湾住宅の知識'),('contract.html','CONTRACT','契約と費用について'),('life.html','LIFE','台中の生活情報'),('company.html','COMPANY','会社概要'),('contact.html','CONTACT','お問い合わせ')]
NAV_ZH=[('index.html','TOP','首頁'),('../properties.html','PROPERTY','物件情報（日文）'),('../flow.html','FLOW','租屋流程（日文）'),('../company.html','COMPANY','關於我們（日文）'),('../contact.html','CONTACT','聯絡我們（日文）')]
def page(fn,title,body,sub=True,zh=False):
  pre='../' if zh else ''
  nav=NAV_ZH if zh else NAV_JA
  navh=''.join(f'<li><a href="{h}"><span class="en">{e}</span>{j}</a></li>' for h,e,j in nav)
  lang=f'<div class="lang"><a href="{"../index.html" if zh else "index.html"}" class="{"" if zh else "on"}">日本語</a><a href="{"index.html" if zh else "zh/index.html"}" class="{"on" if zh else ""}">中文</a></div>'
  hours='[ 日本時間 ] 10:30-19:30 ／ [ 台灣時間 ] 09:30-18:30' if zh else '受付 日本時間 10:30-19:30（現地 09:30-18:30）'
  cta_h='讓您找到「家」的感覺' if zh else 'お部屋探しのご相談は、日本語でお気軽に。'
  cta_p='休假日：一般國定假日' if zh else '定休日：台湾の祝日'
  html=f'''<!DOCTYPE html><html lang="{"zh-Hant" if zh else "ja"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}｜楽房ホーム Raku Home</title><meta name="description" content="台中で暮らす日本人のための賃貸仲介「楽房ホーム」。日本語で物件探しから契約・入居までサポートします。">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400&family=Noto+Sans+JP:wght@300;400;500&family=Noto+Sans+TC:wght@300;400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{pre}css/style.css"></head><body class="{"sub" if sub else ""}">
<header class="hd"><a class="logo" href="{"index.html"}"><b>楽房ホーム</b><small class="en">RAKU HOME</small></a>
<div class="hd-r">{lang}<div class="hd-tel"><b class="en">TEL {TEL}</b><small>{hours}</small></div></div></header>
<aside class="side"><button class="burger" aria-label="menu"><span></span><span></span><span></span></button>
<div class="side-btns"><a href="tel:+886422556578"><span class="en">TEL</span></a><a class="line" href="{LINEURL}"><span class="en">LINE</span></a><a href="{pre}contact.html"><span class="en">CONTACT</span></a></div></aside>
<nav class="nav"><ul>{navh}</ul></nav>
{body}
<section class="cta"><p class="en">CONTACT</p><h2>{cta_h}</h2><p>{hours}　{cta_p}</p>
<div class="tels"><div><small>{"從日本撥打" if zh else "日本から"}</small><b class="en">{TELJP}</b></div><div><small>{"台灣電話" if zh else "台湾から"}</small><b class="en">{TEL}</b></div></div>
<a class="btn ln" href="{LINEURL}">LINE ID：{LINE}</a>　<a class="btn" href="mailto:{MAIL}">E-mail</a></section>
<footer class="ft"><div class="wrap"><div><a class="logo" href="#"><b>楽房ホーム</b><small class="en">RAKU HOME</small></a><p style="margin-top:20px">40757 台中市西屯区市政路500号19F-7<br>TEL {TEL}　FAX 04-2255-6985<br>{MAIL}<br>中市仲商證字第E0258號</p></div>
<ul>{''.join(f'<li><a href="{h}">{j}</a></li>' for h,e,j in nav[:4])}</ul><ul>{''.join(f'<li><a href="{h}">{j}</a></li>' for h,e,j in nav[4:])}<li><a href="{pre}credits.html">画像クレジット</a></li></ul></div>
<small class="cp en">© Raku Home</small></footer><script src="{pre}js/main.js"></script></body></html>'''
  open(fn,'w').write(html)
def hero(img,en,ja,crumb):
  return f'<section class="ph-hero" style="background-image:url(img/{img})"><div><p class="en">{en}</p><h1>{ja}</h1></div></section><div class="wrap crumb">トップ ＞ {crumb}</div>'
NOTE='<p class="note">※広さは、台湾の商習慣上、共用部分を含んだ面積表示となります。実際のお部屋の広さは、表示の7～8割程度となりますのでご注意ください。<br>※掲載情報は旧サイト掲載時点のものです。最新の空室状況・賃料はお問い合わせください。</p>'
P={
'1R':('1R','1R TYPE',[('p_1r_1.jpg','勤美誠品','10坪（約33.06㎡）','マンション','調査中','1F/6F','10,499元/月','無','2ヶ月','家賃1ヶ月分',''),
 ('p_1r_2.jpg','一品苑','10坪（約33.06㎡）','マンション','調査中','2F/8F','7,000元/月','無','4,500元','家賃1ヶ月分','')]),
'1LDK':('1ldk','1LDK TYPE',[('p_1ldk_1.jpg','世界之心','24.41坪（約80.69㎡）','マンション','2009年08月','19F/26F','16,800元/月','無','2ヶ月','家賃1ヶ月分',''),
 ('p_1ldk_2.jpg','市政101','31.93坪（約105.55㎡）','マンション','2009年08月','4F/15F','26,000元/月','無','2ヶ月','家賃1ヶ月分','')]),
'2LDK以上':('2ldk','2LDK+ TYPE',[('p_2l_1.jpg','五權光河','88坪（約290.9㎡）','マンション','2014年11月','6F/29F','72,000元/月','8,000元/月','2ヶ月分','家賃1ヶ月分','最短契約1年／ペット不可／駐車場有／家具・家電付'),
 ('p_2l_2.jpg','惠宇圓山','50～65坪（約167.42㎡）','マンション','2015年12月','7F/14F','25,000元/月','4,000元/月','2ヶ月','家賃1ヶ月分','駐車場有'),
 ('p_2l_3.jpg','鄉林夏都','34坪（約112㎡）','マンション','2006年','7F/15F','27,000元/月','3,632元/月','2ヶ月','家賃1ヶ月分',''),
 ('p_2l_4.jpg','市政交響曲','33坪（約109㎡）','マンション','2006年','18F/28F','25,000元/月','調査中','2ヶ月','家賃1ヶ月分','')]),
'Office':('office','OFFICE TYPE',[('p_of_1.jpg','親家T3市政國際中心','73坪（約241.3㎡）','事務所','2012年12月','10F/29F','35,200元/月','6,580元/月','2ヶ月','家賃1ヶ月分',''),
 ('p_of_2.jpg','親家T3市政國際中心','4坪（約13.5㎡）','事務所','2012年12月','19F/29F','20,000元/月','無','2ヶ月','家賃1ヶ月分','')]),
'三井outlet周辺':('outlet','MITSUI OUTLET AREA',[('p_mo_1.jpg','遠雄之星','約25～30坪（約82.6～99.2㎡）','マンション','2018年','2F～15F/15F','約18,000～25,000元/月','約2,500元/月','2ヶ月分','家賃1ヶ月分','最短契約1年／ペット不可／駐車場有／家具・家電付')])}
def card(c,t):
  img,n,a,ty,y,f,r,m,d,fee,x=c
  return f'''<article class="card rv"><div class="ph"><img src="img/{img}" alt="{n}" loading="lazy"></div><div class="bd"><p class="type en">{t}</p><h3>{n}</h3><p class="rent">{r}</p>
<dl><dt>広さ</dt><dd>{a}</dd><dt>物件タイプ</dt><dd>{ty}</dd><dt>築年</dt><dd>{y}</dd><dt>階数</dt><dd>{f}</dd><dt>管理費</dt><dd>{m}</dd><dt>保証金</dt><dd>{d}</dd><dt>仲介手数料</dt><dd>{fee}</dd>{f"<dt>その他</dt><dd>{x}</dd>" if x else ""}</dl></div></article>'''
# TOP
feats=[('01','日本語で、ていねいに','お問い合わせから物件のご案内、契約まで日本語で対応いたします。お気軽にどうぞ。'),
('02','取引件数1000件超','台湾に居住される日本人の皆様に広く親しまれ、取引件数は1000件を超えました。'),
('03','当社だけの特選物件','1R・1LDKから2LDK以上、オフィス、三井アウトレット周辺まで、特選物件を多数ご用意しております。')]
pick=[P['1LDK'][2][0],P['2LDK以上'][2][0],P['Office'][2][0]]
top=f'''<section class="fv"><div class="fv-img"></div><div class="fv-tx"><p class="en">TAICHUNG RENTAL SERVICE FOR JAPANESE</p><h1>部屋探しだけではなく、<br><em>"家"</em>探しの手伝い。</h1><a class="btn" href="properties.html">物件情報を見る</a></div><span class="scroll en">SCROLL</span></section>
<section class="sec"><div class="wrap concept"><div class="rv"><div class="ttl l"><span class="en">CONCEPT</span><h2>台湾で、安心して<br>暮らすために。</h2></div></div>
<div class="rv"><p>私たちは、台湾で安心して生活できるよう少しでもお役に立てればと考えております。</p><p>楽房不動産は最初の日本不動産投資専門をはじめ、台湾台中の賃貸にもサービス提供して参りました。取引件数は1000件を超え、台湾に居住される日本人の皆様に広く親しまれております。</p><p>お問い合わせは日本語でお気軽にどうぞ！当社だけの特選物件を多数用意しております。皆様のご連絡を心よりお待ちしております。</p></div></div></section>
<section class="sec gray"><div class="wrap"><div class="ttl rv"><span class="en">NEWS</span><h2>お知らせ</h2></div><ul class="news rv">
<li><time class="en">2020.06.30</time><span class="tag">BLOG</span><a href="#">台中市北区新築高級マンション入居者募集中！ 商店街が充実した北区エリア。家賃2～5万/月、短期賃貸可・法人契約可・オフィス利用可。</a></li>
<li><time class="en">----.--.--</time><span class="tag">INFO</span><span>新しいお知らせはこちらに掲載します。<span class="sample">※サンプル</span></span></li></ul></div></section>
<section class="sec"><div class="wrap"><div class="ttl rv"><span class="en">REASON</span><h2>楽房ホームが選ばれる理由</h2></div><div class="feat">{''.join(f'<div class="rv" style="background:var(--bg2)"><span class="no en">{a}</span><h3>{b}</h3><p>{c}</p></div>' for a,b,c in feats)}</div></div></section>
<section class="sec gray"><div class="wrap"><div class="ttl rv"><span class="en">PROPERTY</span><h2>物件情報</h2></div><div class="cards">{''.join(card(c,t) for c,t in zip(pick,['1LDK','2LDK+','OFFICE']))}</div>
<p style="text-align:center;margin-top:56px"><a class="btn ghost" href="properties.html">すべての物件を見る</a></p></div></section>
<section class="sec"><div class="wrap"><div class="ttl rv"><span class="en">GUIDE</span><h2>はじめての台湾暮らしガイド</h2></div><div class="feat">
<a class="rv" href="flow.html" style="background:var(--bg2);padding:44px 32px"><p class="en" style="color:var(--ac)">FLOW</p><h3 style="font-weight:400">入居までの流れ</h3><p style="font-size:13px">物件選定・ご案内・契約条件の交渉・入居</p></a>
<a class="rv" href="knowledge.html" style="background:var(--bg2);padding:44px 32px"><p class="en" style="color:var(--ac)">KNOWLEDGE</p><h3 style="font-weight:400">台湾住宅の知識</h3><p style="font-size:13px">管理費・駐車場・水道光熱費・浴室とトイレ など</p></a>
<a class="rv" href="contract.html" style="background:var(--bg2);padding:44px 32px"><p class="en" style="color:var(--ac)">CONTRACT</p><h3 style="font-weight:400">契約と費用について</h3><p style="font-size:13px">手付金・敷金・家賃・仲介手数料・契約期間</p></a></div></div></section>'''
page('index.html','台中の日本人向け賃貸',top,sub=False)
# properties
tabs=''.join(f'<a href="#{v[0]}">{k}</a>' for k,v in P.items())
cats=''.join(f'<div class="cat" id="{v[0]}"><h3 class="cath"><small class="en">{v[1]}</small>{k}</h3><div class="cards">{"".join(card(c,v[1]) for c in v[2])}</div></div>' for k,v in P.items())
areas='西屯区・北屯区・南屯区・北区・西区・南区・東区・中区・三井outlet'
page('properties.html','物件情報',hero('skyline2.jpg','PROPERTY','物件情報','物件情報')+f'<section class="sec" style="padding-top:60px"><div class="wrap"><div class="tabs">{tabs}</div><p style="text-align:center;font-size:13px;margin-bottom:60px">対応エリア：{areas}</p>{cats}{NOTE}</div></section>')
# flow
flow=[('物件選定','エリアや家賃といった希望条件を明確に','住みたいエリアを決める上で重要なことは、重視したい条件は何かを考えること。治安や職場・学校などへの交通の便、買物の便、家賃など、いくつかの条件を箇条書きにしてみると優先順位を決められます。'),
('ご案内','物件見学','物件見学で、実際のマンションの管理状況、環境と近くの買い物や交通などをチェックします。<br>その場で即決したいという場合は、物件見学の際に、家賃1ヶ月分程度の手付金、パスポート、在留カード、印鑑を持参しておくとよいでしょう。'),
('契約条件の交渉','具体的な契約内容の交渉','気に入った物件が見つかったら、具体的な契約内容の交渉に入ります。契約発生日・満了日の日付など下記事項を確認します。<br>（1）家賃の支払日、支払方法<br>（2）管理費はいくらで、誰に、いつ支払うのか<br>（3）付帯家具・家電<br>（4）中途解約時の違約金の有無・金額の確認'),
('入居','入居の準備','入居する時は、引越会社、水道工事屋、電気工事屋、テレビ会社、インターネット会社などをチェックします。')]
page('flow.html','入居までの流れ',hero('theater.jpg','FLOW','入居までの流れ','入居までの流れ')+'<section class="sec" style="padding-top:60px"><div class="wrap"><ol class="flow">'+''.join(f'<li class="rv"><div class="st en">STEP<b>0{i+1}</b></div><div><h3>{a}</h3><p style="color:var(--ac);font-size:13px">{b}</p><p style="font-size:14px">{c}</p></div></li>' for i,(a,b,c) in enumerate(flow))+'</ol></div></section>')
# knowledge
kn=[('管理費','共用部分の維持・保全に必要な諸経費で、借主の負担となります。毎月家賃と一緒に支払います。'),
('駐車場と料金','基本的に駐車場が物件についていますが、ついていない可能性もあります。台湾の駐車場の種類は平面式と機械式があります。機械式の場合は、念のためご案内の際にご自身のお車のサイズを測っておきましょう。料金は毎月家賃と一緒に支払います。'),
('水道光熱費','水道、ガス、電気、電話（貸主の回線使用の場合）の名義は通常貸主かその家族の名義になっています。水道・ガス・電気は使用住所、電話は電話番号を確認して支払ってください。水道・ガス・電気は2ヶ月に1回、電話は毎月請求書が来ます。ガスは通常、使用度数を自己申告することになっています。2ヶ月に1回、建物の入口かエレベーター内、掲示板等に度数を記入するピンク色の紙が貼られます。住所を確認して記入してください。'),
('インターネット','インターネットは通常電話回線を使います。台湾では電話回線を使ったADSLのほか、光ファイバーの回線もあります。台湾のプロバイダーは中華電信のHinet、Seednet、日系のSo-net台湾などがあります。料金は50M／10Mで約1,000元程度です（旧サイト掲載時点）。'),
('ケーブルテレビ','台湾のテレビは地上波は4局だけですが、ケーブルテレビを契約すれば60チャンネル以上の番組を見ることができます。その中にNHKワールドや日本の番組を専門に放送するチャンネルもあります。受信料は月々約600元で初回接続費用が1,500～2,000元程度です（旧サイト掲載時点）。支払方法は月払い～半年・1年払いがあります。パラボラアンテナを設置することでBSやCSの視聴も可能ですが、マンションによってはアンテナの設置禁止のところもありますので、ご契約の際にはあらかじめご確認ください。'),
('浴室とトイレ','日本と違い、台湾の浴室とトイレは同じ空間にあります。また、トイレの配水管が細いため、使用済みのトイレットペーパーは流さずゴミ箱に捨てるのが一般的です。最近の新しいマンションでしたら問題なく流すことが可能ですが、念のため水に溶けやすいトイレットペーパーを選ばれるほうが良いでしょう。'),
('住宅設備について','台湾の賃貸物件は家具付きが多く、予算が許せば追加交渉も可能です。')]
page('knowledge.html','台湾住宅の知識',hero('skyline2.jpg','KNOWLEDGE','台湾住宅の知識','台湾住宅の知識')+'<section class="sec" style="padding-top:60px"><div class="wrap"><div class="qa">'+''.join(f'<div class="rv"><h3>{a}</h3><p>{b}</p></div>' for a,b in kn)+'</div></div></section>')
# contract
ct=[('1. 手付金（定金）','ご案内の際に気に入った物件があれば、通常は家賃の1ヶ月分をお支払いいただき、契約時に前家賃に充当されます。ただし、キャンセルした場合は戻ってきません。'),
('2. 敷金（押金）','保証金は「押金」と呼ばれ、契約時に貸主に預け、契約終了後に全額返還されます。ただし、貸主に清算する債務がある場合は差し引かれます。台中では保証金は家賃の2ヶ月分相当で、礼金の類はありません。管理費は共用部の維持保全に必要な諸経費で、借主の負担となります。'),
('3. 家賃（租金）','家賃は「租金」と呼ばれ、通常1ヶ月分を表示します。支払いには1ヶ月のほかに、3ヶ月・半年・1年先払いの方法があります。法人名義と個人名義で家賃が10%ほど異なる場合があり、賃料の5%の営業税が別途かかります。1ヶ月分とは家賃開始日から翌月の家賃開始前日までで、日割り計算はされません。家賃に含まれるのは賃料のみで、その他はすべて借主の負担となります。'),
('4. 仲介手数料とサービス代','基本は家賃の1ヶ月分です。'),
('5. 契約期間','台湾の賃貸契約期間は基本的に1年間です。契約時に入居日を決め、入居日から1年間を計算します。'),
('注意事項：中途解約','契約期間途中での解約には違約金（基本は家賃の1ヶ月分）の支払いが慣習としてありますので、契約時に違約金の有無と範囲の確認が必要です。'),
('注意事項：退居','最終月家賃の日割計算は通常行われません。また、敷金は水道光熱費の精算や清掃・損傷補修等の費用を差し引いてから返還されます。')]
page('contract.html','契約と費用について',hero('theater.jpg','CONTRACT','契約と費用について','契約と費用について')+'<section class="sec" style="padding-top:60px"><div class="wrap"><div class="qa">'+''.join(f'<div class="rv"><h3>{a}</h3><p>{b}</p></div>' for a,b in ct)+'</div></div></section>')
# life
lf=[('交通','台中市内の主な交通手段はタクシー、路線バスとなります。日本人の方が一番乗りやすいのはタクシーでしょう。<br>タクシー（初乗り85元～）黄色い車体が目印／路線バス（初乗り20元～）日本と違い手を上げて停めてください。<br><small>※旧サイト掲載時点の情報です。現在台中にはMRT（緑線）も開通しています。</small>'),
('お買い物','台中市には百貨店（SOGO・三越・TopCity大遠百・中友・勤美・德安百貨）やショッピングモール（タイガーシティー）があり、お買い物はとても便利です。日本の食材も中型スーパー（裕毛屋・頂好Welcome）で比較的豊富に揃い、大型スーパー（カルフール・COSTCO）などもあります。'),
('幼稚園','多くの日本人のお子さんが通われているのが安君兒幼稚園（エンジェル幼稚園）です。日本人の先生もおられ、日本人学級（日僑班）があるのも特徴です。<br>台中市太原六街11号　TEL 04-2295-2566'),
('学校','台中には台北、高雄に次いで日本人学校があります。市内から少し離れていますが、送迎の専用バスがあります。詳しくは台中日本人学校にご確認ください。<br>台中市大雅区秀山村平和南路33号　TEL 04-2567-2079'),
('進学塾','日本人経営の進学塾で、台中日本人学校の生徒を対象に指導しています。日本語堪能な台湾人講師による中国語会話教室もあります。<br>一橋慶應アカデミー　台中市西区華美西街1-40-1　TEL 04-2327-1111'),
('病院','台湾の医療技術は日本とほぼ同等レベルですので、安心して受診できます。診察料は一般的な治療で、台湾の健康保険証が有効な病院で約100～200元、保険が使えない場合は約1,000～2,000元程度が目安です（旧サイト掲載時点）。'),
('書店','台中にも日本書籍が揃った紀伊國屋書店があります（旧サイト掲載時はSOGO百貨12F）。価格は日本に比べ多少割高ですが、どうしても読みたい本がある方には便利です。')]
page('life.html','台中の生活情報',hero('hero.jpg','LIFE','台中の生活情報','台中の生活情報')+'<section class="sec" style="padding-top:60px"><div class="wrap"><div class="qa">'+''.join(f'<div class="rv"><h3>{a}</h3><p>{b}</p></div>' for a,b in lf)+'</div><p class="note">※掲載先の住所・電話番号は旧サイトの情報です。ご利用前に各施設へご確認ください。</p></div></section>')
# company
co=[('社名','楽房ホーム（Raku Home）'),('免許','中市仲商證字第E0258號'),('所属団体','台中市不動產仲介經紀商業同業公會'),('本社','40757 台中市西屯区市政路500号19F-7'),('代表番号','TEL 04-2255-6578　FAX 04-2255-6985'),('E-MAIL',MAIL),('事業内容','不動産賃貸仲介事業／プロパティマネジメント事業／不動産売買仲介事業／海外投資家向け事業'),('グループ会社','樂房東京不動產、楽房ホーム、日本杉木包車案內')]
grp='<div class="qa" style="margin-top:80px"><div class="rv"><h3>楽房東京不動産</h3><p>日本、台湾、イギリス、タイ。国境を超えて、世界中の不動産を世界の人々に。資産運用コンサルティングを行う不動産のグローバル集団です。<br><a href="http://www.thefun.com.tw" style="color:var(--ac)">www.thefun.com.tw</a></p></div><div class="rv"><h3>日本杉木包車旅行案内</h3><p>関西を中心に、通訳サービス案内付の高級ハイヤーサービス。通訳、ビジネス、旅行。<br><a href="http://www.3-moo.com" style="color:var(--ac)">www.3-moo.com</a></p></div></div>'
page('company.html','会社概要',hero('skyline2.jpg','COMPANY','会社概要','会社概要')+'<section class="sec" style="padding-top:60px"><div class="wrap"><table class="co rv">'+''.join(f'<tr><th>{a}</th><td>{b}</td></tr>' for a,b in co)+'</table>'+grp+'</div></section>')
# contact
cbody=f'''<section class="sec" style="padding-top:60px"><div class="wrap"><div class="ttl rv"><span class="en">CONTACT</span><h2>ご相談とご質問</h2></div><p style="text-align:center" class="rv">お問い合わせは日本語でお気軽にどうぞ。お電話・LINE・メールで承ります。</p>
<div class="feat" style="margin-top:60px"><a class="rv" href="tel:+886422556578" style="background:var(--bg2);padding:44px 32px;text-align:center"><p class="en" style="color:var(--ac)">TEL</p><h3 style="font-weight:400">日本から {TELJP}<br>台湾から {TEL}</h3><p style="font-size:12px">日本時間 10:30-19:30／現地時間 09:30-18:30<br>定休日：台湾の祝日</p></a>
<a class="rv" href="{LINEURL}" style="background:var(--bg2);padding:44px 32px;text-align:center"><p class="en" style="color:var(--ac2)">LINE</p><h3 style="font-weight:400">LINE ID：{LINE}</h3><p style="font-size:12px">LINEで友だち追加してメッセージをお送りください。</p></a>
<a class="rv" href="mailto:{MAIL}" style="background:var(--bg2);padding:44px 32px;text-align:center"><p class="en" style="color:var(--ac)">MAIL</p><h3 style="font-weight:400">{MAIL}</h3><p style="font-size:12px">FAX：04-2255-6985</p></a></div>
<table class="co rv" style="margin-top:80px"><tr><th>所在地</th><td>40757 台中市西屯区市政路500号19F-7</td></tr><tr><th>連絡先</th><td>{TELJP}（日本から）<br>台北 02-2100-1568<br>台中 04-2255-6578</td></tr></table>
<iframe title="map" style="width:100%;height:380px;border:0;margin-top:40px" loading="lazy" src="https://www.google.com/maps?q=台中市西屯区市政路500号&output=embed"></iframe>
<p class="note">個人情報のお取り扱いについて：本サービスは、楽房ホームが窓口となり、お客様からのお問い合わせについて営業店へ転送を行うものです。ご提供いただいた個人情報は、楽房ホームの営業店へ提供し、資料送付・お知らせの電子メール送信・電話連絡等の目的で保管します。</p></div></section>'''
page('contact.html','お問い合わせ',hero('theater.jpg','CONTACT','お問い合わせ','お問い合わせ')+cbody)
# credits
cr='''<section class="sec" style="padding-top:140px"><div class="wrap"><div class="ttl"><span class="en">CREDITS</span><h2>画像クレジット</h2></div><table class="co">
<tr><th>boulevard.jpg</th><td>AI 生成画像（イメージ）</td></tr><tr><th>hero.jpg</th><td>"Taichung Skyline" — Wikimedia Commons（元画像 Pexels）, CC0<br>https://commons.wikimedia.org/wiki/File:Taichung_Skyline.jpg</td></tr>
<tr><th>theater.jpg</th><td>"National Taichung Theater 2019" — Nico Kaiser, CC BY 2.0<br>https://commons.wikimedia.org/wiki/File:National_Taichung_Theater_2019.jpg</td></tr>
<tr><th>skyline2.jpg</th><td>"Taichung skyline 20170128" — bryan..., CC BY-SA 2.0<br>https://commons.wikimedia.org/wiki/File:Taichung_skyline_20170128.jpg</td></tr>
<tr><th>p_*.jpg</th><td>物件写真：楽房ホーム旧サイト（mookyoto.wixsite.com/rakuhome）掲載画像</td></tr></table></div></section>'''
page('credits.html','画像クレジット',cr)
# zh top
zh=f'''<section class="fv"><div class="fv-img" style="background-image:url(../img/boulevard.jpg)"></div><div class="fv-tx"><p class="en">TAICHUNG RENTAL SERVICE</p><h1>讓您找到<br><em>「家」</em>的感覺</h1><a class="btn" href="../contact.html">聯絡我們</a></div></section>
<section class="sec"><div class="wrap concept"><div class="rv"><div class="ttl l"><span class="en">ABOUT</span><h2>公司概要</h2></div></div><div class="rv">
<p>本公司位於台中七期市政路上，專營台日不動產相關業務。為台灣房東與日本租客把關，幫助客戶跨越語言隔閡，順利完成契約為目的。</p>
<p>楽房不動產擁有充滿日本相關情報的專業團隊，以及超過1000件以上的物件。</p>
<p>「責任」是樂房一路走來不變的精神與承諾。因為對於服務永無止境的熱情，我們得以在中部的日本不動產相關產業中豎立領先地位，獲得許多客戶與合作夥伴的肯定。</p></div></div></section>
<section class="sec gray"><div class="wrap"><div class="ttl rv"><span class="en">SERVICE</span><h2>服務項目</h2></div><div class="feat">
<div class="rv"><span class="no en">01</span><h3>日本租客租屋仲介</h3><p>以日文協助在台中工作的日本人找房、看屋、議約到入住。</p></div>
<div class="rv"><span class="no en">02</span><h3>台灣房東委託</h3><p>為台灣房東與日本租客把關，跨越語言隔閡順利完成契約。</p></div>
<div class="rv"><span class="no en">03</span><h3>東京不動產投資</h3><p>集團公司樂房東京不動產提供日本不動產投資服務。</p></div></div></div></section>'''
os.chdir('zh');page('index.html','首頁',zh,sub=False,zh=True)
