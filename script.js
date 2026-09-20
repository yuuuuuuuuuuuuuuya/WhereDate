/* =====================================================================
   WhereData（データはどこへ？）  script.js

   【このファイルの読み方】
     1. 設定（CONFIG）……… アニメーションの速さ、写真の差し替え
     2. 教材データ（C）…… ★ 文章・問題・選択肢はすべてここ ★
                          先生が内容を変えたいときは、ここだけ編集すれば OK です
     3. アイコン・写真
     4. 部品（ヘルパー関数・データの流れ図 buildStage）
     5. 状態（学習の進み具合）と画面の切り替え
     6. 体験1〜3 の流れ（EXP）
     7. 各画面（スタート／えらぶ／体験／くらべる／共通点／言語化／ふりかえり）
     8. 起動
   ===================================================================== */
(() => {
'use strict';

/* =====================================================================
   1. 設定
   ===================================================================== */
const CONFIG = {
  // アニメーションの速さ。1 = ふつう、1.5 = 1.5倍ゆっくり、0.7 = 少し速い
  speed: 1,

  // 写真を自分のものに変えたいとき：
  // 同じフォルダに写真（例 photo.jpg）を置き、下に 'photo.jpg' と書く。
  // 空のままなら、内蔵のイラスト（山と空）を使う。
  photoUrl: '',
  photoAlt: '山と空の写真',
};

/* =====================================================================
   2. 教材データ  ★ 先生が編集する場所 ★
   ---------------------------------------------------------------------
   ・文章はそのまま書き換えて大丈夫です。
   ・options（選択肢）の id は、プログラムが使うので変えないでください。
     label（表示される文章）だけ変えられます。
   ・ok: true は「正解」の目印です。
   ===================================================================== */
const C = {

  /* 画面上部の「いまどこ？」に出る 5 つの区切り */
  sections: ['はじめ', '体験', 'くらべる', 'まとめ', 'ふりかえり'],

  /* 共通の言葉 */
  common: {
    next: 'つぎへ',
    replay: 'もういちど見る',
    toChoose: 'えらぶ画面へ',
    tagPredict: '予想する',
    tagAct: 'やってみる',
    predLabel: 'あなたの予想',
    saved: '予想を きめたよ。つぎに やってみよう！',
    // 予想への反応（不正解を強く否定しない言い方にしています）
    same: '予想どおり！',
    diff: 'やってみて、わかったね。',
    unknown: 'わからなくても だいじょうぶ。やってみて わかったね。',
  },

  /* 画面1：スタート */
  start: {
    lead: ['写真やメッセージを送ったとき、', 'データはどこへ行くんだろう？'],
    nodes: ['スマートフォン', '？？？', 'インターネット'],
    button: 'はじめる',
    replay: 'もういちど見る',
  },

  /* 画面2：この写真、どうする？ */
  choose: {
    title: 'この写真、どうする？',
    lead: 'やりたいことを選ぼう',
    items: [
      { id: 'send',    emoji: '📩', label: '友達に送る' },
      { id: 'cloud',   emoji: '☁️', label: 'クラウドに保存する' },
      { id: 'publish', emoji: '🌐', label: 'Webで公開する' },
    ],
    todo: 'やってみよう',
    done: 'できた',
    compare: '3つをくらべる',
    left: n => `あと ${n}つ やると おせるよ`,
    all: '3つ できたね！',
  },

  /* ---------- 体験1：友達に送る ---------- */
  send: {
    no: 1, emoji: '📩', label: '友達に送る',
    predict: {
      lead: 'この写真を友達に送ります。',
      question: '「送る」を押したあと、写真はどうなると思う？',
      answer: 'via',   // 正解の id（予想への反応に使う。正解を出さない場面では null）
      options: [
        { id: 'direct',  icon: 'arrowRight', label: '直接、友達に届く' },
        { id: 'via',     icon: 'server',     label: 'どこかを通って届く' },
        { id: 'unknown', icon: 'help',       label: 'わからない' },
      ],
    },
    phases: [
      { icon: 'download', label: '受け取る' },
      { icon: 'gear',     label: '処理する' },
      { icon: 'send',     label: '相手に届ける' },
    ],
    doSend: {
      lead: '「送信する」を押して、写真の動きを見よう。',
      button: '送信する',
      idle: '「送信する」を おそう',
      captions: [
        '写真が 自分の端末から Webサービスへ 向かうよ',
        '① Webサービスが 受け取る',
        '② Webサービスが 処理する',
        '③ Webサービスが 相手に届ける',
        '友達の端末へ 向かうよ',
        '友達の端末に とどいた！',
      ],
      result: '写真は Webサービスを通って、友達に届いたよ。',
    },
    delPredict: {
      lead: '写真が 友達に届いたよ。',
      question: '自分の端末から写真を削除したら、友達の写真はどうなる？',
      answer: 'stay',
      options: [
        { id: 'gone',    icon: 'trash', label: '友達の写真も消える' },
        { id: 'stay',    icon: 'image', label: '友達の写真は残る' },
        { id: 'unknown', icon: 'help',  label: 'わからない' },
      ],
    },
    delDo: {
      lead: '実際に、自分の端末の写真を削除してみよう。',
      button: '自分の端末から削除する',
      idle: '「削除する」を おそう',
      captions: [
        '自分の端末の写真を 削除したよ',
        '友達の写真は… そのまま のこっているね',
      ],
      badge: 'のこっている',
      result: '自分のデータを削除しても、すでに相手に渡ったデータまで消えるとは限りません。',
    },
  },

  /* ---------- 体験2：クラウドに保存する ---------- */
  cloud: {
    no: 2, emoji: '☁️', label: 'クラウドに保存する',
    predict: {
      lead: 'この写真を クラウドに保存します。',
      question: 'クラウドに保存すると、写真はどこに保存されると思う？',
      answer: 'service',
      options: [
        { id: 'mine',    icon: 'phone', label: '自分の端末だけ' },
        { id: 'service', icon: 'cloud', label: 'インターネットにつながったサービス側' },
        { id: 'friend',  icon: 'user',  label: '友達の端末' },
        { id: 'unknown', icon: 'help',  label: 'わからない' },
      ],
    },
    save: {
      lead: '「クラウドに保存」を押して、写真の動きを見よう。',
      button: 'クラウドに保存',
      idle: '「クラウドに保存」を おそう',
      captions: [
        '写真が スマートフォンから インターネットへ 向かうよ',
        'インターネットを通って クラウドサービスへ 向かうよ',
        '保存できた！ スマートフォンにも クラウドにも 写真が あるよ',
      ],
      result: '写真は インターネットを通って、クラウドサービスに保存されたよ。',
      note: 'スマートフォンにも、クラウドにも、写真があるね。',
    },
    other: {
      lead: '別の端末から 見られるかな？',
      button: '別の端末から見てみる',
      idle: '「別の端末から見てみる」を おそう',
      captions: [
        'パソコンから クラウドに 「見せて！」と 聞いているよ',
        'クラウドの写真が パソコンに 向かうよ',
        'パソコンにも 写真が 表示された！',
      ],
      result: 'クラウドに保存されたデータは、別の端末から利用することもできます。',
    },
    del: {
      lead: 'こんどは、クラウドの写真を 削除してみよう。',
      buttons: ['クラウドの写真を削除する', '別の端末から もういちど見る'],
      idle: 'ボタンを おそう',
      captions: [
        'クラウドの写真を 削除したよ',
        'パソコンから クラウドに 「見せて！」と 聞いているよ',
        'クラウドに 写真が ないので、パソコンにも 表示されなくなったよ',
      ],
      asks: ['見せて！', 'ないよ'],
      result: 'クラウドの写真を削除すると、別の端末からも見えなくなったね。',
      model: 'WhereDataでは仕組みを分かりやすくしたモデルです。実際のクラウドサービスでは、同期・ゴミ箱・バックアップなどによって動きが変わります。',
    },
  },

  /* ---------- 体験3：Webで公開する ---------- */
  publish: {
    no: 3, emoji: '🌐', label: 'Webで公開する',
    // 見る人たち（group で「誰に見えるか」を決めています）
    audience: [
      { id: 'a1', name: '自分',     group: 'me' },
      { id: 'a2', name: '友達',     group: 'friend' },
      { id: 'a3', name: '友達',     group: 'friend' },
      { id: 'a4', name: 'ほかの人', group: 'other' },
      { id: 'a5', name: 'ほかの人', group: 'other' },
      { id: 'a6', name: 'ほかの人', group: 'other' },
    ],
    // 公開範囲ごとに、見られる group
    allows: { me: ['me'], friends: ['me', 'friend'], all: ['me', 'friend', 'other'] },
    predict: {
      lead: 'この写真を Webで公開します。',
      question: 'Webで公開すると、この写真は誰が見ることができると思う？',
      answer: null,   // 正解がひとつではないので null
      anyFeedback: '見られる人は、公開のしかたで かわるよ。つぎで ためしてみよう。',
      options: [
        { id: 'me',      icon: 'user',  label: '自分だけ' },
        { id: 'chosen',  icon: 'users', label: '決めた人だけ' },
        { id: 'many',    icon: 'globe', label: 'たくさんの人' },
        { id: 'unknown', icon: 'help',  label: 'わからない' },
      ],
    },
    scope: {
      lead: '誰に見せますか？',
      q: '見せる人を えらんでから「公開する」を おそう',
      options: [
        { id: 'me',      emoji: '👤', label: '自分だけ' },
        { id: 'friends', emoji: '👥', label: '友達だけ' },
        { id: 'all',     emoji: '🌐', label: 'みんな' },
      ],
      button: '公開する',
      need: '先に「誰に見せますか？」を えらぼう',
      idle: '見せる人を えらんで「公開する」を おそう',
      captions: {
        start: '写真を Webサービスに 投稿するよ',
        posted: '投稿できた！ 見られる人が きまるよ',
        done: {
          me: '見られるのは 自分だけ',
          friends: '見られるのは 自分と 友達',
          all: '見られるのは みんな（知らない人も）',
        },
      },
      seen: 'みえる',
      unseen: 'みえない',
      result: {
        me: '「自分だけ」にすると、見られるのは 自分だけ。',
        friends: '「友達だけ」にすると、自分と友達が 見られる。',
        all: '「みんな」にすると、知らない人も 見られる。',
      },
      note: '公開する人を かえて、「もういちど見る」で ためしてみよう。',
    },
    share: {
      lead: '友達がこの写真を別の人に共有しました。',
      sub: {
        me: '（「自分だけ」だと友達は見られないので、ここでは「友達だけ」で公開したことにするよ）',
        friends: '「友達だけ」に公開していたよ。',
        all: '「みんな」に公開していたよ。',
      },
      button: '友達が共有する',
      idle: '「友達が共有する」を おそう',
      captions: [
        '友達が この写真を 別の人に 共有するよ',
        '別の人にも 写真が とどいた！',
      ],
      badge: 'ひろがった',
      friendName: '友達',
      otherName: '別の人',
      result: '保存や再共有によって、自分が考えていた範囲より情報が広がる場合があります。',
    },
    del: {
      lead: '投稿を 削除してみよう。',
      button: '投稿を削除する',
      idle: '「投稿を削除する」を おそう',
      captions: [
        'Webサービスの 投稿を 削除したよ',
        '友達や 別の人が 持っている 写真は… そのまま のこっているね',
      ],
      badge: 'のこっている',
      result: 'Webサービス上の投稿は消えますが、すでに他の人が保存・再共有したデータは残る場合があります。',
    },
  },

  /* 比較画面 */
  compare: {
    title: '3つをくらべてみよう',
    lead: '「？」を おして、こたえを えらぼう',
    cols: [
      { id: 'send',    emoji: '📩', label: '友達に送る' },
      { id: 'cloud',   emoji: '☁️', label: 'クラウドに保存する' },
      { id: 'publish', emoji: '🌐', label: 'Webで公開する' },
    ],
    rows: [
      {
        id: 'where', label: 'データはどこへ行った？',
        ans: {
          send:    { icon: 'send',  text: 'Webサービスを通って 友達の端末へ' },
          cloud:   { icon: 'cloud', text: 'Webサービスの クラウドに 保存された' },
          publish: { icon: 'globe', text: 'Webサービスに 投稿されて 公開された' },
        },
        hint: {
          send: '友達に 届くまでを 思い出そう',
          cloud: '「保存」した 場所を 思い出そう',
          publish: '「公開」した あとを 思い出そう',
        },
      },
      {
        id: 'who', label: '誰が利用できた？',
        ans: {
          send:    { icon: 'user',   text: '送った 友達' },
          cloud:   { icon: 'laptop', text: '自分（ほかの端末からも）' },
          publish: { icon: 'users',  text: 'えらんだ人（ひろがることも）' },
        },
        hint: {
          send: '写真を 受け取ったのは だれかな？',
          cloud: 'パソコンからも 見られたね',
          publish: '「誰に見せますか？」で えらんだね',
        },
      },
      {
        id: 'del', label: '削除するとどうなった？',
        ans: {
          send:    { icon: 'trash', text: '自分の分は 消える。友達の分は のこる' },
          cloud:   { icon: 'trash', text: 'クラウドの写真が 消えて、ほかの端末でも 見えない' },
          publish: { icon: 'trash', text: '投稿は 消える。保存・再共有された分は のこることも' },
        },
        hint: {
          send: '削除したあと、友達の写真は どうだった？',
          cloud: '削除したあと、パソコンでは どうだった？',
          publish: '削除したあと、友達や 別の人は どうだった？',
        },
      },
    ],
    correct: 'そのとおり！',
    wrong: 'おしい！ ヒントを見て、もういちど えらぼう。',
    doneTitle: 'くらべられたね！',
    doneText: '同じ写真でも、データの行き先や、見られる人や、削除したあとが ちがったね。',
    next: '3つの 共通点を 考える',
  },

  /* 共通点を考える画面 */
  common3: {
    title: '3つに共通していたことは？',
    lead: '図を見て 考えよう',
    diagram: { me: '自分の端末', data: 'データ', service: 'Webサービス' },
    lanes: [
      { id: 'send',    word: 'proc',  icon: 'user',  name: '友達の端末',       tag: '受け取る → 処理する → 届ける' },
      { id: 'cloud',   word: 'save',  icon: 'cloud', name: 'クラウド',         tag: '保存する' },
      { id: 'publish', word: 'share', icon: 'globe', name: 'みんなが見るWeb',  tag: '公開する・共有する' },
    ],
    q1: {
      text: '3つとも、データは どこを通った？',
      options: [
        { id: 'svc',    label: 'Webサービス',                 icon: 'server', ok: true },
        { id: 'own',    label: '自分の端末の中だけ',          icon: 'phone' },
        { id: 'friend', label: '友達の家の中だけ',            icon: 'user' },
      ],
      hint: 'ヒント：図の まんなかを 見てみよう',
      right: 'そのとおり！ 3つとも Webサービスを 通っていたね。',
    },
    q2: {
      text: 'Webサービスは、データを どうしていた？ ことばを おして 図で たしかめよう',
      words: [
        { id: 'proc',  label: '処理する' },
        { id: 'save',  label: '保存する' },
        { id: 'share', label: '共有する' },
      ],
    },
    conclusion: 'Webサービスでは、目的に応じてデータを処理したり、保存したり、共有したりする。',
    keywords: ['Webサービス', 'データ', '処理', '保存', '共有'],
    next: '自分の言葉で 言ってみよう',
  },

  /* 言語化画面（3段階） */
  words: {
    title: 'Webサービスって、何をしているの？',
    lead: '自分に合った レベルを えらぼう',
    levels: [
      { id: 1, title: 'レベル1', desc: '正しい ことばを えらぶ',        icon: 'check' },
      { id: 2, title: 'レベル2', desc: 'ことばカードで 文を つくる',    icon: 'image' },
      { id: 3, title: 'レベル3', desc: '自分の ことばで 書く',          icon: 'pencil' },
    ],
    next: 'ふりかえりへ',
    otherLevel: 'ほかのレベルを えらぶ',
    l1: [
      {
        q: 'Webサービスが あつかっているのは？',
        options: [{ t: 'データ', ok: true }, { t: 'にもつ' }, { t: 'おかね' }],
        hint: '写真や メッセージのことだよ',
      },
      {
        q: 'Webサービスは、データを どうする？',
        options: [
          { t: '目的に応じて、処理・保存・共有する', ok: true },
          { t: 'かならず 自分の端末に もどす' },
          { t: '送ったら かならず 消す' },
        ],
        hint: '3つの 体験を 思い出そう',
      },
      {
        q: '自分のデータを削除したら、相手に渡ったデータは？',
        options: [
          { t: '消えるとは かぎらない', ok: true },
          { t: 'かならず 消える' },
          { t: 'かならず のこる' },
        ],
        hint: '友達に送った 体験を 思い出そう',
      },
    ],
    l1right: 'そのとおり！',
    l1wrong: 'おしい！ もういちど えらぼう。',
    l1next: 'つぎの もんだい',
    l1done: 'レベル1 できた！',
    l2: {
      lead: 'カードを おして、文を かんせいさせよう',
      parts: ['Webサービスでは、データを', 'したり、', 'したりできます。'],
      cards: [
        { id: 'proc',  label: '処理' },
        { id: 'save',  label: '保存' },
        { id: 'share', label: '共有' },
      ],
      done: 'レベル2 できた！',
      more: '「処理」「保存」「共有」は、どれも Webサービスが していることだよ。',
      reset: 'やりなおす',
    },
    l3: {
      question: 'Webサービスって何をしているの？',
      placeholder: '自分の言葉で書いてみよう',
      chips: ['Webサービス', 'データ', '処理', '保存', '共有'],
      chipLabel: 'ことばの ヒント（おすと 入るよ）',
      button: 'できた',
      mine: 'あなたの ことば',
      example: 'れい：Webサービスは、目的に応じて、データを処理したり、保存したり、共有したりしているよ。',
      ok: '自分の ことばで 書けたね！ ちがっていても だいじょうぶ。',
      done: 'レベル3 できた！',
    },
  },

  /* 最後の生活場面 */
  final: {
    title: '写真を撮影しました。',
    question: 'このあと、あなたならどうしますか？',
    lead2: 'いくつ えらんでも いいよ',
    first: label => `学習の はじめに えらんだのは「${label}」でした。`,
    firstNone: '',
    actions: [
      { id: 'keep',    emoji: '📱', label: '端末に残す' },
      { id: 'send',    emoji: '📩', label: '友達・家族に送る' },
      { id: 'cloud',   emoji: '☁️', label: 'クラウドに保存する' },
      { id: 'publish', emoji: '🌐', label: 'Webで公開する' },
      { id: 'delete',  emoji: '🗑️', label: '削除する' },
    ],
    reasonTitle: 'どうして、それを選びましたか？',
    reasonLead: '理由を えらぼう（いくつでも OK）',
    reasons: [
      { id: 'memory',   label: '思い出として のこしたいから' },
      { id: 'show',     label: '友達や家族に 見せたいから' },
      { id: 'lose',     label: 'なくしたくないから' },
      { id: 'devices',  label: 'ほかの端末でも 見たいから' },
      { id: 'many',     label: 'たくさんの人に 見てほしいから' },
      { id: 'private',  label: 'ほかの人に 見られたくないから' },
      { id: 'unneeded', label: 'いらないから' },
    ],
    memoLabel: 'ほかの理由が あれば 書こう（書かなくても OK）',
    memoPlaceholder: '自分の言葉で書いてみよう',
    summaryTitle: 'ふりかえり',
    yourChoice: 'あなたの えらんだこと',
    yourReason: 'あなたの りゆう',
    learned: '今日 まなんだこと',
    learnedList: [
      { emoji: '📩', text: '送ったデータは、自分が削除しても 相手に のこることが ある' },
      { emoji: '☁️', text: 'クラウドのデータは、ほかの端末からも 使える' },
      { emoji: '🌐', text: '公開すると、思っていたより 広がることが ある' },
    ],
    message: 'データの あつかい方に、ひとつだけの 正解は ありません。目的に応じて えらぼう。',
    restart: 'はじめから やりなおす',
    next: 'りゆうを えらぶ',
    toSummary: 'ふりかえりを 見る',
    none: '（えらんでいません）',
  },
};

/* =====================================================================
   3. アイコンと写真
   ===================================================================== */
// 線のアイコン（24×24）。名前をつけて icon('phone') のように使います。
const ICONS = {
  phone:   '<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><line x1="11" y1="18.5" x2="13" y2="18.5"/>',
  laptop:  '<rect x="4.5" y="5" width="15" height="10.5" rx="1.6"/><path d="M2.5 19h19"/>',
  server:  '<rect x="3.5" y="3.5" width="17" height="7" rx="2"/><rect x="3.5" y="13.5" width="17" height="7" rx="2"/><line x1="7" y1="7" x2="7.01" y2="7"/><line x1="7" y1="17" x2="7.01" y2="17"/>',
  cloud:   '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  globe:   '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  user:    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users:   '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  lock:    '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  eye:     '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  trash:   '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  check:   '<polyline points="20 6 9 17 4 12"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  replay:  '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  help:    '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  send:    '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  image:   '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  pin:     '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  pencil:  '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  gear:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
};

// 内蔵の「写真」（山と空のイラスト）。色は単色で、図の中に何枚あっても崩れません。
const PHOTO_SVG = `
<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${CONFIG.photoAlt}">
  <rect width="400" height="300" fill="#8EC9F5"/>
  <rect y="150" width="400" height="150" fill="#C9E7FB"/>
  <circle cx="318" cy="66" r="28" fill="#FFE7A0"/>
  <g fill="#FFFFFF" opacity=".95">
    <ellipse cx="84" cy="64" rx="40" ry="13"/><ellipse cx="116" cy="54" rx="26" ry="12"/>
    <ellipse cx="246" cy="112" rx="34" ry="10"/>
  </g>
  <path d="M0 214 L64 168 L120 204 L182 158 L246 208 L322 170 L400 206 V300 H0 Z" fill="#9DB9DA"/>
  <path d="M104 236 L200 88 L296 236 Z" fill="#4C73B0"/>
  <path d="M200 88 L172 132 L188 124 L200 140 L214 122 L228 132 Z" fill="#FFFFFF"/>
  <path d="M0 300 V240 Q100 220 200 238 T400 232 V300 Z" fill="#62B77F"/>
  <path d="M0 300 V268 Q120 250 232 268 T400 260 V300 Z" fill="#3F9C66"/>
  <rect x="52" y="246" width="6" height="18" fill="#6B4A2B"/>
  <circle cx="55" cy="240" r="16" fill="#2F8A57"/>
</svg>`;

/* =====================================================================
   4. 部品（ヘルパー）
   ===================================================================== */

/** 要素を作る小さな道具。h('div', {class:'a'}, '文字', 子要素) */
function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'disabled') el.disabled = true;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** アイコン */
function icon(name) {
  const s = document.createElement('span');
  s.className = 'icon';
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  return s;
}

/** 写真（イラスト or 差し替え画像） */
function photoEl() {
  if (CONFIG.photoUrl) {
    return h('img', { class: 'photo-img', src: CONFIG.photoUrl, alt: CONFIG.photoAlt, draggable: 'false' });
  }
  const d = document.createElement('div');
  d.className = 'photo-svg';
  d.innerHTML = PHOTO_SVG;
  return d;
}

const T = x => (typeof x === 'function' ? x() : x);   // 関数なら実行して値を返す

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 文章の中のキーワードを目立たせる */
function highlight(text, words) {
  const re = new RegExp('(' + words.join('|') + ')', 'g');
  return text.split(re).map(part => (words.includes(part) ? h('mark', {}, part) : part));
}

/* ---- アニメーションを安全に止めるしくみ ----
   画面を切り替えるたびに runId が変わり、待っていたアニメーションは自動で中止されます。 */
const CANCEL = Symbol('cancel');
let runId = 0;
function sleep(ms) {
  const id = runId;
  return new Promise((resolve, reject) => {
    setTimeout(() => (id === runId ? resolve() : reject(CANCEL)), ms * CONFIG.speed);
  });
}
async function safe(fn) {
  try { await fn(); } catch (e) { if (e !== CANCEL) console.error(e); }
}

/* ---------------------------------------------------------------------
   データの流れ図（ステージ）
   nodes の例：{ id:'me', icon:'phone', name:'自分の端末' }
     kind   : 'basic'（ふつう）/'service'（Webサービス）/'mystery'（？）/'pass'（通り道）/'audience'（見る人たち）
     noSlot : true にすると「写真の枠」を出さない
     phases : Webサービス内の「受け取る→処理する→…」の表示
   --------------------------------------------------------------------- */
function makeNode(n) {
  const kind = n.kind || 'basic';
  const el = h('div', { class: `node node-${kind}`, dataset: { id: n.id } },
    h('div', { class: 'node-badge' }),
    h('div', { class: 'node-icon' }, icon(n.icon)),
    h('div', { class: 'node-name' }, n.name));

  if (kind === 'audience') {
    el.append(h('div', { class: 'audience-grid' }, C.publish.audience.map(a =>
      h('div', { class: 'avatar', dataset: { id: a.id } },
        h('div', { class: 'avatar-face' }, icon('user'), h('span', { class: 'avatar-badge' })),
        h('div', { class: 'avatar-name' }, a.name),
        h('div', { class: 'avatar-state' })))));
  } else if (kind !== 'pass' && !n.noSlot) {
    el.append(
      h('div', { class: 'slot' }, h('div', { class: 'slot-photo' }, photoEl()), h('div', { class: 'slot-q' })),
      h('div', { class: 'slot-label' }));
  }
  if (n.phases) {
    el.append(h('div', { class: 'phases' }, n.phases.map(p => h('div', { class: 'phase' }, icon(p.icon), p.label))));
  }
  return el;
}

function buildStage(nodes, opts = {}) {
  const root = h('div', { class: 'stage' });
  const layer = h('div', { class: 'token-layer' });
  const els = {}, cfg = {}, links = [];
  const order = nodes.map(n => n.id);

  nodes.forEach((n, i) => {
    cfg[n.id] = n;
    if (i > 0) {
      const label = opts.linkLabels && opts.linkLabels[i - 1];
      const link = h('div', { class: 'link' + (label ? ' has-label' : '') },
        label ? h('span', { class: 'link-label' }, label) : null);
      links.push(link);
      root.append(link);
    }
    els[n.id] = makeNode(n);
    root.append(els[n.id]);
  });
  root.append(layer);

  const anchorOf = id => els[id].querySelector('.audience-grid') || els[id].querySelector('.slot') || els[id].querySelector('.node-icon');

  return {
    root,
    /** 写真を「ある／ない／？」にする */
    setHas(id, val, o = {}) {
      const el = els[id], n = cfg[id];
      if (!el) return;
      const label = el.querySelector('.slot-label'), q = el.querySelector('.slot-q');
      if (!label) return;
      el.classList.remove('has', 'none', 'unknown');
      if (val === true) {
        el.classList.add('has');
        label.textContent = o.label || n.hasLabel || '写真あり';
        q.textContent = '';
      } else if (val === 'unknown') {
        el.classList.add('unknown');
        label.textContent = o.label || '？';
        q.textContent = '？';
      } else {
        el.classList.add('none');
        label.textContent = o.label || n.noLabel || '写真なし';
        q.textContent = '';
      }
    },
    /** 「のこっている」などの目印をつける */
    mark(id, text) {
      const el = els[id];
      el.classList.add('remain');
      const b = el.querySelector('.node-badge');
      b.textContent = text;
      b.classList.add('show');
    },
    /** Webサービスの中の段階（0,1,2 を光らせる。3 で全部おわり。-1 でリセット） */
    setPhase(id, i) {
      els[id].querySelectorAll('.phase').forEach((p, k) => {
        p.classList.toggle('active', k === i);
        p.classList.toggle('done', k < i);
      });
    },
    /** 見る人の「みえる／みえない」 */
    setAudience(aid, mode) {
      const a = root.querySelector(`.avatar[data-id="${aid}"]`);
      if (!a) return;
      a.classList.remove('can', 'cannot');
      const badge = a.querySelector('.avatar-badge');
      const state = a.querySelector('.avatar-state');
      badge.replaceChildren();
      state.textContent = '';
      if (mode) {
        a.classList.add(mode);
        badge.append(icon(mode === 'can' ? 'eye' : 'lock'));
        state.textContent = mode === 'can' ? C.publish.scope.seen : C.publish.scope.unseen;
      }
    },
    pulse(id) {
      const el = els[id];
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
    },
    /** 写真（や「見せて！」の吹き出し）を from から to へゆっくり動かす */
    async fly(from, to, ms = 2000, o = {}) {
      const sr = root.getBoundingClientRect();
      const ar = anchorOf(from).getBoundingClientRect();
      const br = anchorOf(to).getBoundingClientRect();
      const ax = ar.left + ar.width / 2 - sr.left, ay = ar.top + ar.height / 2 - sr.top;
      const bx = br.left + br.width / 2 - sr.left, by = br.top + br.height / 2 - sr.top;

      const tok = h('div', { class: 'token' + (o.kind ? ` token-${o.kind}` : '') });
      if (o.kind === 'ask' || o.kind === 'no') {
        tok.append(icon(o.kind === 'ask' ? 'eye' : 'help'), h('span', {}, o.text || ''));
      } else {
        tok.append(photoEl());
      }
      const pos = (x, y, s) => `translate(calc(${x}px - 50%), calc(${y}px - 50%)) scale(${s})`;
      tok.style.transform = pos(ax, ay, 0.85);
      layer.append(tok);

      // 通り道の線を光らせる
      const i0 = order.indexOf(from), i1 = order.indexOf(to);
      const lit = links.slice(Math.min(i0, i1), Math.max(i0, i1));
      lit.forEach(l => l.classList.add('active'));

      void tok.offsetWidth;   // 動き出す前の位置を確定させる
      tok.style.transition = `transform ${ms * CONFIG.speed}ms cubic-bezier(.4,.05,.3,1)`;
      tok.style.transform = pos(bx, by, 1);
      try {
        await sleep(ms + 60);
      } finally {
        lit.forEach(l => l.classList.remove('active'));
        tok.remove();
      }
    },
  };
}

/* ---------- よく使う部品 ---------- */

/** 選択ボタン（大きな1行） */
function choiceBtn({ ic, emoji, label, selected, onclick }) {
  return h('button', {
    type: 'button', class: 'choice' + (selected ? ' selected' : ''),
    'aria-pressed': String(!!selected), onclick,
  },
    emoji ? h('span', { class: 'choice-icon emoji' }, emoji) : (ic ? h('span', { class: 'choice-icon' }, icon(ic)) : null),
    h('span', { class: 'choice-label' }, label),
    h('span', { class: 'mark', 'aria-hidden': 'true' }, icon('check')));
}

/** 結果カード */
function resultCard({ title, note, tone }) {
  return h('div', { class: 'result' + (tone === 'notice' ? ' notice' : '') },
    h('span', { class: 'result-icon' }, icon(tone === 'notice' ? 'info' : 'check')),
    h('div', { class: 'result-body' },
      h('p', { class: 'result-title' }, title),
      note ? h('p', { class: 'result-note' }, note) : null));
}

/** 画面の外枠。inner=本文、actionChildren=下のボタン */
function screenEl(inner, actionChildren, cls = '') {
  const el = h('div', { class: 'screen ' + cls }, inner);
  if (actionChildren) {
    el.append(h('div', { class: 'actions' }, h('div', { class: 'actions-inner' }, actionChildren)));
  }
  return el;
}
const bigBtn = (label, onclick, opts = {}) =>
  h('button', { type: 'button', class: 'btn ' + (opts.secondary ? 'btn-secondary' : 'btn-primary btn-xl') + (opts.small ? ' btn-sm' : ''), onclick, disabled: opts.disabled, hidden: opts.hidden },
    opts.iconLeft ? icon(opts.iconLeft) : null, label, opts.iconRight ? icon(opts.iconRight) : null);

/* =====================================================================
   5. 状態（学習の進み具合）と画面の切り替え
   ===================================================================== */
const freshState = () => ({
  done: { send: false, cloud: false, publish: false },   // 3つの体験が終わったか
  firstChoice: null,                                     // 最初に選んだ体験
  pred: {},                                              // 予想の記録 { 'send.route': 'via' ... }
  scope: null,                                           // 公開範囲
  compare: { filled: {}, wrong: {}, order: {}, active: null, msg: '' },
  common: { solved: false, wrongIds: [], words: {} },
  words: { done: { 1: false, 2: false, 3: false }, text: '' },
  final: { actions: [], reasons: [], memo: '' },
});
const state = freshState();

let nav = { screen: 'start', step: 0 };
const navStack = [];

const SECTION_OF = { start: 0, choose: 1, send: 1, cloud: 1, publish: 1, compare: 2, common: 3, words: 3, final: 4 };

function go(screen, step = 0) { navStack.push(nav); nav = { screen, step }; render(); }
function back() {
  const p = navStack.pop();
  nav = p || { screen: 'start', step: 0 };
  render();
}
/** 指定した画面まで戻る（見つからなければその画面へ） */
function returnTo(screen) {
  let found = null;
  while (navStack.length && !found) {
    const p = navStack.pop();
    if (p.screen === screen) found = p;
  }
  nav = found || { screen, step: 0 };
  render();
}
function restart() {
  Object.assign(state, freshState());
  navStack.length = 0;
  nav = { screen: 'start', step: 0 };
  render();
}

let afterTasks = [];
const after = fn => afterTasks.push(fn);   // 画面を表示した「あと」に動かしたい処理

function renderHeader() {
  document.body.dataset.screen = nav.screen;
  document.getElementById('btn-back').hidden = nav.screen === 'start';
  const cur = SECTION_OF[nav.screen] ?? 0;
  document.getElementById('progress').replaceChildren(...C.sections.map((label, i) =>
    h('span', { class: 'pg' + (i === cur ? ' current' : i < cur ? ' past' : ''), 'aria-current': i === cur ? 'step' : null },
      i < cur ? icon('check') : null,
      h('span', { class: 'pg-label' }, label))));
}

function render() {
  runId++;                       // 動いているアニメーションを止める
  afterTasks = [];
  const root = document.getElementById('screen');
  root.replaceChildren();
  root.append(VIEWS[nav.screen](nav.step));
  renderHeader();
  window.scrollTo(0, 0);
  const h1 = root.querySelector('h1');
  if (h1) h1.focus({ preventScroll: true });
  const tasks = afterTasks;
  afterTasks = [];
  tasks.forEach(fn => requestAnimationFrame(() => safe(fn)));
}

/* =====================================================================
   6. 体験1〜3 の流れ（EXP）
   ---------------------------------------------------------------------
   type: 'predict'（予想）／'scene'（操作して動きを見る）
   ===================================================================== */

/* 図に出てくる登場人物（端末やサービス） */
const N = {
  me:      () => ({ id: 'me', icon: 'phone', name: '自分の端末' }),
  friend:  () => ({ id: 'friend', icon: 'user', name: '友達の端末' }),
  mystery: () => ({ id: 'svc', kind: 'mystery', icon: 'help', name: '？？？', noSlot: true }),
  svcSend: () => ({ id: 'svc', kind: 'service', icon: 'server', name: 'Webサービス', noSlot: true, phases: C.send.phases }),
  phone:   () => ({ id: 'me', icon: 'phone', name: 'スマートフォン' }),
  net:     () => ({ id: 'net', kind: 'pass', icon: 'globe', name: 'インターネット' }),
  cloud:   () => ({ id: 'cloud', icon: 'cloud', name: 'クラウドサービス' }),
  pc:      () => ({ id: 'pc', icon: 'laptop', name: 'パソコン' }),
  svcPub:  () => ({ id: 'svc', kind: 'service', icon: 'server', name: 'Webサービス', hasLabel: '投稿あり', noLabel: '投稿なし' }),
  aud:     () => ({ id: 'aud', kind: 'audience', icon: 'users', name: '見られる人' }),
  pFriend: () => ({ id: 'friend', icon: 'user', name: C.publish.share.friendName }),
  pOther:  () => ({ id: 'other', icon: 'user', name: C.publish.share.otherName }),
};

const publishScope = () => state.scope || 'friends';   // 未選択のときは「友達だけ」で見せる

const EXP = {};

/* ---------- 体験1：友達に送る ---------- */
EXP.send = {
  key: 'send', ...pick(C.send), steps: [
    { type: 'predict', key: 'send.route', content: () => C.send.predict,
      stage: () => ({ nodes: [N.me(), N.mystery(), N.friend()],
        init: s => { s.setHas('me', true); s.setHas('friend', false); } }) },

    { type: 'scene', key: 'send.do', content: () => C.send.doSend, idle: C.send.doSend.idle,
      stage: () => ({ nodes: [N.me(), N.svcSend(), N.friend()],
        init: s => { s.setHas('me', true); s.setHas('friend', false); } }),
      actions: [{ label: C.send.doSend.button, icon: 'send', run: async (s, say) => {
        const cap = C.send.doSend.captions;
        say(cap[0]);
        await s.fly('me', 'svc', 2200);
        s.pulse('svc');
        for (let i = 0; i < 3; i++) {          // 受け取る → 処理する → 相手に届ける
          s.setPhase('svc', i);
          say(cap[i + 1]);
          await sleep(1500);
        }
        s.setPhase('svc', 3);
        say(cap[4]);
        await s.fly('svc', 'friend', 2200);
        s.setHas('friend', true);
        s.pulse('friend');
        say(cap[5]);
      } }],
      result: () => [predCard('send.route'), resultCard({ title: C.send.doSend.result })] },

    { type: 'predict', key: 'send.delete', content: () => C.send.delPredict,
      stage: () => ({ nodes: [N.me(), N.svcSend(), N.friend()],
        init: s => { s.setHas('me', true); s.setHas('friend', true); s.setPhase('svc', 3); } }) },

    { type: 'scene', key: 'send.delDo', content: () => C.send.delDo, idle: C.send.delDo.idle, finishExp: true,
      stage: () => ({ nodes: [N.me(), N.svcSend(), N.friend()],
        init: s => { s.setHas('me', true); s.setHas('friend', true); s.setPhase('svc', 3); } }),
      actions: [{ label: C.send.delDo.button, icon: 'trash', run: async (s, say) => {
        const cap = C.send.delDo.captions;
        say(cap[0]);
        s.setHas('me', false);
        await sleep(1600);
        s.mark('friend', C.send.delDo.badge);
        s.pulse('friend');
        say(cap[1]);
      } }],
      result: () => [predCard('send.delete'), resultCard({ title: C.send.delDo.result, tone: 'notice' })] },
  ],
};

/* ---------- 体験2：クラウドに保存する ---------- */
const CLOUD_LINKS = ['インターネット', 'インターネット'];
EXP.cloud = {
  key: 'cloud', ...pick(C.cloud), steps: [
    { type: 'predict', key: 'cloud.where', content: () => C.cloud.predict,
      stage: () => ({ nodes: [N.phone(), N.net(), N.cloud()],
        init: s => { s.setHas('me', true); s.setHas('cloud', 'unknown'); } }) },

    { type: 'scene', key: 'cloud.save', content: () => C.cloud.save, idle: C.cloud.save.idle,
      stage: () => ({ nodes: [N.phone(), N.net(), N.cloud()],
        init: s => { s.setHas('me', true); s.setHas('cloud', false); } }),
      actions: [{ label: C.cloud.save.button, icon: 'cloud', run: async (s, say) => {
        const cap = C.cloud.save.captions;
        say(cap[0]);
        await s.fly('me', 'net', 1800);
        s.pulse('net');
        say(cap[1]);
        await s.fly('net', 'cloud', 1800);
        s.setHas('cloud', true);
        s.pulse('cloud');
        say(cap[2]);
      } }],
      result: () => [predCard('cloud.where'), resultCard({ title: C.cloud.save.result, note: C.cloud.save.note })] },

    { type: 'scene', key: 'cloud.other', content: () => C.cloud.other, idle: C.cloud.other.idle,
      stage: () => ({ nodes: [N.phone(), N.cloud(), N.pc()], linkLabels: CLOUD_LINKS,
        init: s => { s.setHas('me', true); s.setHas('cloud', true); s.setHas('pc', false); } }),
      actions: [{ label: C.cloud.other.button, icon: 'laptop', run: async (s, say) => {
        const cap = C.cloud.other.captions;
        say(cap[0]);
        await s.fly('pc', 'cloud', 1700, { kind: 'ask', text: '見せて！' });
        s.pulse('cloud');
        say(cap[1]);
        await s.fly('cloud', 'pc', 2200);
        s.setHas('pc', true);
        s.pulse('pc');
        say(cap[2]);
      } }],
      result: () => [resultCard({ title: C.cloud.other.result })] },

    { type: 'scene', key: 'cloud.del', content: () => C.cloud.del, idle: C.cloud.del.idle, finishExp: true,
      model: C.cloud.del.model,
      stage: () => ({ nodes: [N.phone(), N.cloud(), N.pc()], linkLabels: CLOUD_LINKS,
        init: s => { s.setHas('me', true); s.setHas('cloud', true); s.setHas('pc', true); } }),
      actions: [
        { label: C.cloud.del.buttons[0], icon: 'trash', run: async (s, say) => {
          say(C.cloud.del.captions[0]);
          s.setHas('cloud', false);
          s.pulse('cloud');
          await sleep(1400);
        } },
        { label: C.cloud.del.buttons[1], icon: 'eye', run: async (s, say) => {
          say(C.cloud.del.captions[1]);
          await s.fly('pc', 'cloud', 1700, { kind: 'ask', text: C.cloud.del.asks[0] });
          await s.fly('cloud', 'pc', 1700, { kind: 'no', text: C.cloud.del.asks[1] });
          s.setHas('pc', false, { label: '見つからない' });
          s.pulse('pc');
          say(C.cloud.del.captions[2]);
        } },
      ],
      result: () => [resultCard({ title: C.cloud.del.result, tone: 'notice' })] },
  ],
};

/* ---------- 体験3：Webで公開する ---------- */
EXP.publish = {
  key: 'publish', ...pick(C.publish), steps: [
    { type: 'predict', key: 'publish.who', content: () => C.publish.predict,
      stage: () => ({ nodes: [N.me(), N.svcPub(), N.aud()],
        init: s => { s.setHas('me', true); s.setHas('svc', false); } }) },

    { type: 'scene', key: 'publish.scope', content: () => C.publish.scope, idle: C.publish.scope.idle,
      stage: () => ({ nodes: [N.me(), N.svcPub(), N.aud()],
        init: s => { s.setHas('me', true); s.setHas('svc', false); } }),
      controls: ctx => scopePicker(ctx),
      actions: [{ label: C.publish.scope.button, icon: 'globe', enabled: () => !!state.scope, needText: C.publish.scope.need,
        run: async (s, say) => {
          const P = C.publish, allowed = P.allows[state.scope];
          say(P.scope.captions.start);
          await s.fly('me', 'svc', 2000);
          s.setHas('svc', true);
          s.pulse('svc');
          say(P.scope.captions.posted);
          await s.fly('svc', 'aud', 1800);
          for (const a of P.audience) {            // 1人ずつ「みえる／みえない」を出す
            s.setAudience(a.id, allowed.includes(a.group) ? 'can' : 'cannot');
            await sleep(450);
          }
          say(P.scope.captions.done[state.scope]);
        } }],
      result: () => [
        predCard('publish.who'),
        resultCard({ title: C.publish.scope.result[state.scope], note: C.publish.scope.note }),
      ] },

    { type: 'scene', key: 'publish.share',
      content: () => ({ lead: C.publish.share.lead, sub: C.publish.share.sub[state.scope || 'friends'] }),
      idle: C.publish.share.idle,
      stage: () => ({ nodes: [N.me(), N.svcPub(), N.pFriend(), N.pOther()],
        init: s => { s.setHas('me', true); s.setHas('svc', true); s.setHas('friend', true); s.setHas('other', false); } }),
      actions: [{ label: C.publish.share.button, icon: 'users', run: async (s, say) => {
        say(C.publish.share.captions[0]);
        await s.fly('friend', 'other', 2200);
        s.setHas('other', true);
        s.mark('other', C.publish.share.badge);
        s.pulse('other');
        say(C.publish.share.captions[1]);
      } }],
      result: () => [resultCard({ title: C.publish.share.result, tone: 'notice' })] },

    { type: 'scene', key: 'publish.del', content: () => C.publish.del, idle: C.publish.del.idle, finishExp: true,
      stage: () => ({ nodes: [N.me(), N.svcPub(), N.pFriend(), N.pOther()],
        init: s => { s.setHas('me', true); s.setHas('svc', true); s.setHas('friend', true); s.setHas('other', true); } }),
      actions: [{ label: C.publish.del.button, icon: 'trash', run: async (s, say) => {
        say(C.publish.del.captions[0]);
        s.setHas('svc', false);
        s.pulse('svc');
        await sleep(1600);
        s.mark('friend', C.publish.del.badge);
        s.mark('other', C.publish.del.badge);
        say(C.publish.del.captions[1]);
      } }],
      result: () => [resultCard({ title: C.publish.del.result, tone: 'notice' })] },
  ],
};

function pick(o) { return { no: o.no, emoji: o.emoji, label: o.label }; }

/** 見せる範囲を選ぶボタン（体験3の2つ目の画面） */
function scopePicker(ctx) {
  const row = h('div', { class: 'scope-row' });
  const btns = C.publish.scope.options.map(o => {
    const b = h('button', {
      type: 'button', class: 'scope-btn' + (state.scope === o.id ? ' selected' : ''),
      'aria-pressed': String(state.scope === o.id), 'data-lockable': true,
      onclick: () => {
        state.scope = o.id;
        btns.forEach(x => {
          const on = x.dataset.id === o.id;
          x.classList.toggle('selected', on);
          x.setAttribute('aria-pressed', String(on));
        });
        ctx.changed();
      },
      dataset: { id: o.id },
    }, h('span', { class: 'scope-emoji' }, o.emoji), h('span', { class: 'scope-label' }, o.label),
       h('span', { class: 'mark', 'aria-hidden': 'true' }, icon('check')));
    return b;
  });
  row.append(...btns);
  return h('div', { class: 'scope-box' }, h('p', { class: 'scope-q' }, C.publish.scope.q), row);
}

/* ---------- 予想の記録カード ---------- */
function findStep(key) {
  for (const e of Object.values(EXP)) {
    const s = e.steps.find(x => x.key === key);
    if (s) return s;
  }
  return null;
}
/** 「あなたの予想」と、その反応（点数はつけず、やさしい言い方だけ） */
function predCard(key) {
  const sel = state.pred[key];
  const c = findStep(key).content();
  const opt = c.options.find(o => o.id === sel);
  if (!opt) return null;
  let msg;
  if (c.answer === null) msg = c.anyFeedback;
  else if (sel === 'unknown') msg = C.common.unknown;
  else msg = sel === c.answer ? C.common.same : C.common.diff;
  return h('div', { class: 'pred-card' },
    h('span', { class: 'pill' }, C.common.predLabel),
    h('strong', {}, opt.label),
    h('span', { class: 'pred-msg' }, msg));
}

/* ---------- 体験の画面（共通の枠） ---------- */
function stepHeader(exp, idx) {
  const total = exp.steps.length;
  const tag = exp.steps[idx].type === 'predict' ? C.common.tagPredict : C.common.tagAct;
  return h('div', { class: 'crumb-row' },
    h('span', { class: 'crumb' }, h('span', { class: 'crumb-emoji', 'aria-hidden': 'true' }, exp.emoji), `体験${exp.no}　${exp.label}`),
    h('span', { class: 'crumb-tag' }, tag),
    h('span', { class: 'dots', role: 'img', 'aria-label': `${idx + 1} / ${total}` },
      Array.from({ length: total }, (_, i) => h('span', { class: 'dot' + (i === idx ? ' now' : i < idx ? ' past' : '') }))),
    h('span', { class: 'dots-text' }, `${idx + 1} / ${total}`));
}

function experienceView(exp, idx) {
  return exp.steps[idx].type === 'predict' ? predictView(exp, idx) : sceneView(exp, idx);
}

/** 予想の画面：選ぶだけ。正解・不正解はここでは出さない */
function predictView(exp, idx) {
  const step = exp.steps[idx], c = step.content();
  const inner = h('div', { class: 'screen-inner' });
  inner.append(stepHeader(exp, idx),
    h('p', { class: 'lead' }, c.lead),
    h('h1', { tabindex: '-1', class: 'question' }, c.question));

  const def = step.stage();
  const stage = buildStage(def.nodes, { linkLabels: def.linkLabels });
  def.init(stage);
  inner.append(h('div', { class: 'stage-wrap compact' }, stage.root));

  const hint = h('p', { class: 'saved-hint', 'aria-live': 'polite' });
  const next = bigBtn(C.common.next, () => go(nav.screen, nav.step + 1), { iconRight: 'arrowRight', disabled: true });
  const list = h('div', { class: 'choice-list' });
  const draw = () => {
    const sel = state.pred[step.key];
    list.replaceChildren(...c.options.map(o => choiceBtn({
      ic: o.icon, label: o.label, selected: sel === o.id,
      onclick: () => { state.pred[step.key] = o.id; draw(); },
    })));
    next.disabled = !sel;
    hint.textContent = sel ? C.common.saved : '';
  };
  draw();
  inner.append(list, hint);
  return screenEl(inner, [next]);
}

/** 操作の画面：ボタンを押す → データの動きを見る → 結果 */
function sceneView(exp, idx) {
  const step = exp.steps[idx], c = step.content();
  const inner = h('div', { class: 'screen-inner' });
  inner.append(stepHeader(exp, idx), h('h1', { tabindex: '-1' }, c.lead));
  if (c.sub) inner.append(h('p', { class: 'lead' }, c.sub));

  const stageWrap = h('div', { class: 'stage-wrap' });
  const caption = h('div', { class: 'caption', 'aria-live': 'polite' });
  const resultSlot = h('div', { class: 'result-slot' });
  let stage = null, ai = 0, busy = false, finished = false;

  const say = t => {
    caption.textContent = t;
    caption.classList.remove('swap');
    void caption.offsetWidth;
    caption.classList.add('swap');
  };

  const ctx = {
    changed: () => { if (finished) mount(); else update(); },   // 範囲を変えたら最初から
  };
  inner.append(stageWrap);
  if (step.controls) inner.append(step.controls(ctx));
  inner.append(resultSlot);
  if (step.model) inner.append(h('p', { class: 'model-note' }, icon('info'), step.model));

  const replayBtn = bigBtn(C.common.replay, () => mount(), { secondary: true, iconLeft: 'replay', hidden: true });
  const mainBtn = bigBtn('', () => safe(doAction));
  const nextBtn = bigBtn('', () => (step.finishExp ? returnTo('choose') : go(nav.screen, nav.step + 1)), { hidden: true });
  const needHint = h('span', { class: 'need-hint' });

  function update() {
    const act = step.actions[ai];
    mainBtn.hidden = finished;
    if (act) {
      mainBtn.replaceChildren(icon(act.icon), act.label);
      const ok = !act.enabled || act.enabled();
      mainBtn.disabled = busy || !ok;
      needHint.textContent = (!ok && act.needText) ? act.needText : '';
    }
    nextBtn.hidden = !finished;
    replayBtn.hidden = !finished || busy;
    nextBtn.replaceChildren(step.finishExp ? C.common.toChoose : C.common.next, icon('arrowRight'));
    inner.querySelectorAll('[data-lockable]').forEach(b => { b.disabled = busy; });
  }

  /** 図を最初の状態に戻す（もういちど見る） */
  function mount() {
    runId++;
    const def = step.stage();
    stage = buildStage(def.nodes, { linkLabels: def.linkLabels });
    def.init(stage);
    stageWrap.replaceChildren(caption, stage.root);   // 説明文は図の上（いつも見える位置）
    say(step.idle || '');
    ai = 0; busy = false; finished = false;
    resultSlot.replaceChildren();
    update();
  }

  async function doAction() {
    if (busy) return;
    const act = step.actions[ai];
    if (!act || (act.enabled && !act.enabled())) return;
    busy = true;
    update();
    await act.run(stage, say);      // 途中で画面が切り替わると、ここで自動的に中止される
    busy = false;
    ai++;
    if (ai >= step.actions.length) finish(); else update();
  }

  function finish() {
    finished = true;
    if (step.finishExp) state.done[exp.key] = true;     // ★ 体験おわり（チェックがつく）
    resultSlot.replaceChildren(...step.result().filter(Boolean));
    update();
    requestAnimationFrame(() => resultSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  mount();
  return screenEl(inner, [replayBtn, h('div', { class: 'main-action' }, needHint, mainBtn, nextBtn)]);
}

/* =====================================================================
   7. 各画面
   ===================================================================== */

/* ---------- 画面1：スタート ---------- */
function startView() {
  const inner = h('div', { class: 'screen-inner start' });
  inner.append(
    h('div', { class: 'logo' },
      h('span', { class: 'logo-mark', 'aria-hidden': 'true' }, icon('pin')),
      h('h1', { tabindex: '-1' }, 'WhereData')),
    h('p', { class: 'subtitle' }, 'データはどこへ？'),
    h('p', { class: 'start-lead' }, C.start.lead.map((line, i) => [i ? h('br') : null, line])));

  const nodes = [
    { id: 'me', icon: 'phone', name: C.start.nodes[0] },
    { id: 'q', kind: 'mystery', icon: 'help', name: C.start.nodes[1], noSlot: true },
    { id: 'net', icon: 'globe', name: C.start.nodes[2], noSlot: true },
  ];
  const wrap = h('div', { class: 'stage-wrap hero' });
  const play = async () => {
    runId++;
    const st = buildStage(nodes);
    st.setHas('me', true);
    wrap.replaceChildren(st.root);
    await safe(async () => {
      await sleep(900);
      await st.fly('me', 'q', 2600);
      st.pulse('q');
    });
  };
  inner.append(wrap, bigBtn(C.start.replay, () => play(), { secondary: true, small: true, iconLeft: 'replay' }));
  after(play);
  return screenEl(inner, [bigBtn(C.start.button, () => go('choose'), { iconRight: 'arrowRight' })], 'is-start');
}

/* ---------- 画面2：この写真、どうする？ ---------- */
function chooseView() {
  const c = C.choose;
  const inner = h('div', { class: 'screen-inner' });
  inner.append(h('h1', { tabindex: '-1' }, c.title), h('p', { class: 'lead' }, c.lead));

  const list = h('div', { class: 'exp-list' }, c.items.map(it => {
    const done = state.done[it.id];
    return h('button', {
      type: 'button', class: 'exp-btn' + (done ? ' done' : ''),
      onclick: () => { if (!state.firstChoice) state.firstChoice = it.id; go(it.id, 0); },
    },
      h('span', { class: 'exp-emoji', 'aria-hidden': 'true' }, it.emoji),
      h('span', { class: 'exp-label' }, it.label),
      h('span', { class: 'exp-state' }, done ? icon('check') : icon('arrowRight'), done ? c.done : c.todo));
  }));
  inner.append(h('div', { class: 'choose-grid' }, h('div', { class: 'photo-frame' }, photoEl()), list));

  const left = c.items.filter(it => !state.done[it.id]).length;
  const btn = bigBtn(c.compare, () => go('compare'), { iconRight: 'arrowRight', disabled: left > 0 });
  const hint = h('span', { class: 'need-hint' }, left > 0 ? c.left(left) : c.all);
  return screenEl(inner, [h('div', { class: 'main-action' }, hint, btn)]);
}

/* ---------- 比較画面 ---------- */
function compareView() {
  const c = C.compare, S = state.compare;
  const inner = h('div', { class: 'screen-inner' });
  inner.append(h('h1', { tabindex: '-1' }, c.title), h('p', { class: 'lead' }, c.lead));

  const cells = [];
  c.rows.forEach(r => c.cols.forEach(col => cells.push({ r, col, key: `${r.id}.${col.id}` })));
  const firstEmpty = () => (cells.find(x => !S.filled[x.key]) || {}).key || null;
  if (!S.active || S.filled[S.active]) S.active = firstEmpty();

  const table = h('div', { class: 'cmp' });
  const panel = h('div', { class: 'qpanel-slot' });
  const next = bigBtn(c.next, () => go('common'), { iconRight: 'arrowRight', disabled: true });

  function draw() {
    // 表
    const head = [h('div', { class: 'cmp-corner' }), ...c.cols.map(col =>
      h('div', { class: 'cmp-h' }, h('span', { class: 'cmp-h-emoji', 'aria-hidden': 'true' }, col.emoji), col.label))];
    const body = c.rows.flatMap(r => [
      h('div', { class: 'cmp-rowlabel' }, r.label),
      ...c.cols.map(col => {
        const key = `${r.id}.${col.id}`, filled = S.filled[key], active = S.active === key;
        if (filled) {
          const a = r.ans[col.id];
          return h('div', { class: 'cmp-cell filled' }, h('span', { class: 'cmp-ans-icon' }, icon(a.icon)), h('span', {}, a.text));
        }
        return h('button', {
          type: 'button', class: 'cmp-cell' + (active ? ' active' : ''), 'aria-label': `${r.label} ${col.label} の こたえを えらぶ`,
          onclick: () => { S.active = key; S.msg = ''; draw(); },
        }, h('span', { class: 'q' }, '？'));
      }),
    ]);
    table.replaceChildren(...head, ...body);

    // 問題パネル
    const cur = cells.find(x => x.key === S.active);
    if (!cur) {
      panel.replaceChildren(resultCard({ title: c.doneTitle, note: c.doneText }));
      next.disabled = false;
      return;
    }
    const { r, col, key } = cur;
    if (!S.order[key]) S.order[key] = shuffle(c.cols.map(x => x.id));
    const wrong = S.wrong[key] || [];
    panel.replaceChildren(h('div', { class: 'qpanel' },
      S.msg ? h('p', { class: 'qmsg ok' }, S.msg) : null,
      h('p', { class: 'q-title' }, h('span', { class: 'q-emoji', 'aria-hidden': 'true' }, col.emoji), `${col.label}：${r.label}`),
      h('div', { class: 'choice-list' }, S.order[key].map(cid => {
        const a = r.ans[cid], isWrong = wrong.includes(cid);
        const b = choiceBtn({
          ic: a.icon, label: a.text, selected: false,
          onclick: () => {
            if (cid === col.id) {
              S.filled[key] = true; S.msg = c.correct; S.active = firstEmpty();
            } else {
              S.wrong[key] = [...wrong, cid]; S.msg = '';
            }
            draw();
          },
        });
        if (isWrong) { b.classList.add('wrong'); b.disabled = true; }
        return b;
      })),
      wrong.length ? h('p', { class: 'qmsg hint' }, icon('info'), `${c.wrong}　ヒント：${r.hint[col.id]}`) : null));
    next.disabled = true;
  }
  draw();
  inner.append(table, panel);
  return screenEl(inner, [next]);
}

/* ---------- 共通点を考える画面 ---------- */
function commonView() {
  const c = C.common3, S = state.common;
  const inner = h('div', { class: 'screen-inner' });
  inner.append(h('h1', { tabindex: '-1' }, c.title), h('p', { class: 'lead' }, c.lead));

  const hub = h('div', { class: 'hub-wrap' });
  const qArea = h('div', { class: 'q-area' });
  const next = bigBtn(c.next, () => go('words'), { iconRight: 'arrowRight', disabled: true });

  const allWords = () => c.q2.words.every(w => S.words[w.id]);

  function drawHub() {
    const lane = (l, i) => {
      const on = S.words[l.word];
      return [
        h('div', { class: 'hub-link' + (S.solved ? ' lit' : ''), style: `grid-row:${i + 1}`, 'aria-hidden': 'true' },
          h('span', { class: 'data-chip' }, c.diagram.data)),
        h('div', { class: 'hub-dest' + (on ? ' on' : ''), style: `grid-row:${i + 1}` },
          h('span', { class: 'hub-dest-icon' }, icon(l.icon)),
          h('span', { class: 'hub-dest-name' }, l.name),
          h('span', { class: 'hub-dest-tag' }, on ? l.tag : '')),
      ];
    };
    hub.replaceChildren(h('div', { class: 'hub' },
      h('div', { class: 'hub-me' },
        h('span', { class: 'hub-photo' }, photoEl()),
        h('span', { class: 'hub-name' }, c.diagram.me)),
      h('div', { class: 'hub-arrow', 'aria-hidden': 'true' }),
      h('div', { class: 'hub-service' + (S.solved ? ' spot' : '') },
        h('span', { class: 'hub-service-icon' }, icon('server')),
        h('span', { class: 'hub-name' }, S.solved ? c.diagram.service : '？？？')),
      ...c.lanes.flatMap(lane)));
  }

  function drawQ() {
    if (!S.solved) {
      qArea.replaceChildren(h('div', { class: 'qpanel' },
        h('p', { class: 'q-title' }, c.q1.text),
        h('div', { class: 'choice-list' }, c.q1.options.map(o => {
          const b = choiceBtn({
            ic: o.icon, label: o.label, selected: false,
            onclick: () => { if (o.ok) S.solved = true; else S.wrongIds.push(o.id); drawAll(); },
          });
          if (S.wrongIds.includes(o.id)) { b.classList.add('wrong'); b.disabled = true; }
          return b;
        })),
        S.wrongIds.length ? h('p', { class: 'qmsg hint' }, icon('info'), c.q1.hint) : null));
      return;
    }
    const done = allWords();
    qArea.replaceChildren(...[
      h('p', { class: 'qmsg ok' }, c.q1.right),
      h('div', { class: 'qpanel' },
        h('p', { class: 'q-title' }, c.q2.text),
        h('div', { class: 'word-row' }, c.q2.words.map(w =>
          h('button', {
            type: 'button', class: 'word-card big' + (S.words[w.id] ? ' used' : ''),
            'aria-pressed': String(!!S.words[w.id]),
            onclick: () => { S.words[w.id] = true; drawAll(); },
          }, w.label)))),
      done ? h('div', { class: 'conclusion' }, h('p', {}, highlight(c.conclusion, c.keywords))) : null].filter(Boolean));
  }

  function drawAll() { drawHub(); drawQ(); next.disabled = !(S.solved && allWords()); }
  drawAll();
  inner.append(hub, qArea);
  return screenEl(inner, [next]);
}

/* ---------- 言語化画面（レベル1〜3） ---------- */
function wordsView(step) {
  if (step === 1) return level1View();
  if (step === 2) return level2View();
  if (step === 3) return level3View();

  const c = C.words;
  const inner = h('div', { class: 'screen-inner' });
  inner.append(h('h1', { tabindex: '-1' }, c.title), h('p', { class: 'lead' }, c.lead),
    h('div', { class: 'level-list' }, c.levels.map(lv => {
      const done = state.words.done[lv.id];
      return h('button', { type: 'button', class: 'level-btn' + (done ? ' done' : ''), onclick: () => go('words', lv.id) },
        h('span', { class: 'level-badge' }, done ? icon('check') : icon(lv.icon)),
        h('span', { class: 'level-text' }, h('strong', {}, lv.title), h('span', {}, lv.desc)),
        h('span', { class: 'level-go' }, icon('arrowRight')));
    })));
  const any = Object.values(state.words.done).some(Boolean);
  return screenEl(inner, [bigBtn(c.next, () => go('final'), { iconRight: 'arrowRight', disabled: !any })]);
}

/** レベル画面に共通の下ボタン */
function levelActions(n) {
  return [
    bigBtn(C.words.otherLevel, () => back(), { secondary: true }),
    bigBtn(C.words.next, () => go('final'), { iconRight: 'arrowRight', disabled: !state.words.done[n] }),
  ];
}
function levelHeader(n) {
  const lv = C.words.levels[n - 1];
  return h('div', { class: 'crumb-row' }, h('span', { class: 'crumb' }, `${lv.title}　${lv.desc}`));
}

function level1View() {
  const qs = C.words.l1;
  const inner = h('div', { class: 'screen-inner' });
  inner.append(levelHeader(1));
  const area = h('div', { class: 'l1-area' });
  inner.append(area);
  const acts = h('div', { class: 'actions-inner' });
  const el = screenEl(inner, null);
  const bar = h('div', { class: 'actions' }, acts);
  el.append(bar);

  let qi = 0, solved = false, wrongSet = [];
  function draw() {
    const q = qs[qi];
    const isLast = qi === qs.length - 1;
    area.replaceChildren(...[
      h('div', { class: 'dots big' }, qs.map((_, i) => h('span', { class: 'dot' + (i === qi ? ' now' : i < qi ? ' past' : '') }))),
      h('h1', { tabindex: '-1', class: 'question' }, q.q),
      h('div', { class: 'choice-list' }, q.options.map((o, i) => {
        const b = choiceBtn({
          label: o.t, selected: solved && o.ok,
          onclick: () => {
            if (solved) return;
            if (o.ok) { solved = true; if (isLast) state.words.done[1] = true; } else wrongSet.push(i);
            draw();
          },
        });
        if (wrongSet.includes(i)) { b.classList.add('wrong'); b.disabled = true; }
        if (solved) b.disabled = true;
        return b;
      })),
      solved ? h('p', { class: 'qmsg ok' }, isLast ? C.words.l1done : C.words.l1right)
        : (wrongSet.length ? h('p', { class: 'qmsg hint' }, icon('info'), `${C.words.l1wrong}　ヒント：${q.hint}`) : null)].filter(Boolean));
    acts.replaceChildren(
      ...(isLast && solved ? levelActions(1)
        : [bigBtn(C.words.l1next, () => { qi++; solved = false; wrongSet = []; draw(); }, { iconRight: 'arrowRight', disabled: !solved })]));
  }
  draw();
  return el;
}

function level2View() {
  const L = C.words.l2;
  const inner = h('div', { class: 'screen-inner' });
  inner.append(levelHeader(2), h('h1', { tabindex: '-1', class: 'question' }, L.lead));
  const sentence = h('p', { class: 'sentence' });
  const bank = h('div', { class: 'word-row' });
  const msg = h('div');
  const acts = h('div', { class: 'actions-inner' });
  const el = screenEl(inner, null);
  el.append(h('div', { class: 'actions' }, acts));
  inner.append(sentence, bank, msg);

  const slots = [null, null];
  const labelOf = id => L.cards.find(x => x.id === id).label;
  const blank = k => h('button', {
    type: 'button', class: 'blank' + (slots[k] ? ' filled' : ''), 'aria-label': slots[k] ? `${labelOf(slots[k])}（おすと もどる）` : 'あいている',
    onclick: () => { slots[k] = null; draw(); },
  }, slots[k] ? labelOf(slots[k]) : '');

  function draw() {
    sentence.replaceChildren(L.parts[0], blank(0), L.parts[1], blank(1), L.parts[2]);
    bank.replaceChildren(...L.cards.map(cd => h('button', {
      type: 'button', class: 'word-card big' + (slots.includes(cd.id) ? ' used' : ''), disabled: slots.includes(cd.id),
      onclick: () => { const k = slots.indexOf(null); if (k >= 0) { slots[k] = cd.id; draw(); } },
    }, cd.label)));
    const full = !slots.includes(null);
    if (full) state.words.done[2] = true;
    msg.replaceChildren(...(full ? [
      resultCard({ title: `${L.parts[0]}${labelOf(slots[0])}${L.parts[1]}${labelOf(slots[1])}${L.parts[2]}`, note: L.more }),
      h('p', { class: 'qmsg ok' }, L.done)] : []));
    acts.replaceChildren(
      ...(full ? levelActions(2) : [bigBtn(L.reset, () => { slots[0] = slots[1] = null; draw(); }, { secondary: true })]));
  }
  draw();
  return el;
}

function level3View() {
  const L = C.words.l3;
  const inner = h('div', { class: 'screen-inner' });
  inner.append(levelHeader(3), h('h1', { tabindex: '-1', class: 'question' }, L.question));
  const ta = h('textarea', { class: 'textarea', rows: '4', placeholder: L.placeholder, 'aria-label': L.question });
  ta.value = state.words.text;
  const chips = h('div', { class: 'chip-row' },
    h('span', { class: 'chip-label' }, L.chipLabel),
    L.chips.map(w => h('button', {
      type: 'button', class: 'word-card',
      onclick: () => { ta.setRangeText(w, ta.selectionStart, ta.selectionEnd, 'end'); ta.focus(); sync(); },
    }, w)));
  const out = h('div');
  const doneBtn = bigBtn(L.button, () => {
    state.words.done[3] = true;
    showResult();
  }, { iconLeft: 'check', disabled: true });
  const acts = h('div', { class: 'actions-inner' });
  const el = screenEl(inner, null);
  el.append(h('div', { class: 'actions' }, acts));
  inner.append(ta, chips, out);

  function sync() {
    state.words.text = ta.value;
    doneBtn.disabled = ta.value.trim().length === 0;
  }
  function showResult() {
    out.replaceChildren(
      h('div', { class: 'mine' }, h('span', { class: 'pill' }, L.mine), h('p', {}, state.words.text)),
      resultCard({ title: L.ok, note: L.example }));
    acts.replaceChildren(...levelActions(3));
    out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  ta.addEventListener('input', sync);
  sync();
  acts.append(doneBtn);
  if (state.words.done[3]) showResult();
  return el;
}

/* ---------- 最後の生活場面 ---------- */
function finalView(step) {
  const c = C.final, S = state.final;
  const toggle = (arr, id) => { const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else arr.push(id); };

  /* 3つ目：ふりかえり（まとめ） */
  if (step === 2) {
    const inner = h('div', { class: 'screen-inner' });
    const acts = S.actions.map(id => c.actions.find(a => a.id === id));
    const reas = S.reasons.map(id => c.reasons.find(r => r.id === id));
    inner.append(
      h('h1', { tabindex: '-1' }, c.summaryTitle),
      h('div', { class: 'summary' },
        h('section', { class: 'sum-card' }, h('h2', {}, c.yourChoice),
          acts.length ? h('ul', { class: 'sum-list' }, acts.map(a => h('li', {}, h('span', { 'aria-hidden': 'true' }, a.emoji), a.label))) : h('p', { class: 'muted' }, c.none)),
        h('section', { class: 'sum-card' }, h('h2', {}, c.yourReason),
          (reas.length || S.memo.trim())
            ? h('ul', { class: 'sum-list' }, reas.map(r => h('li', {}, r.label)), S.memo.trim() ? h('li', { class: 'memo' }, S.memo.trim()) : null)
            : h('p', { class: 'muted' }, c.none))),
      h('section', { class: 'sum-card learned' }, h('h2', {}, c.learned),
        h('ul', { class: 'sum-list' }, c.learnedList.map(x => h('li', {}, h('span', { 'aria-hidden': 'true' }, x.emoji), x.text)))),
      h('div', { class: 'conclusion' }, h('p', {}, c.message)));
    return screenEl(inner, [bigBtn(c.restart, () => restart(), { secondary: true, iconLeft: 'replay' })]);
  }

  /* 2つ目：どうして？ */
  if (step === 1) {
    const inner = h('div', { class: 'screen-inner' });
    inner.append(h('h1', { tabindex: '-1', class: 'question' }, c.reasonTitle), h('p', { class: 'lead' }, c.reasonLead));
    const list = h('div', { class: 'choice-grid' });
    const draw = () => list.replaceChildren(...c.reasons.map(r => choiceBtn({
      label: r.label, selected: S.reasons.includes(r.id),
      onclick: () => { toggle(S.reasons, r.id); draw(); },
    })));
    draw();
    const ta = h('textarea', { class: 'textarea', rows: '3', placeholder: c.memoPlaceholder, 'aria-label': c.memoLabel });
    ta.value = S.memo;
    ta.addEventListener('input', () => { S.memo = ta.value; });
    inner.append(list, h('label', { class: 'memo-label' }, c.memoLabel), ta);
    return screenEl(inner, [bigBtn(c.toSummary, () => go('final', 2), { iconRight: 'arrowRight' })]);
  }

  /* 1つ目：撮影したあと、どうする？ */
  const inner = h('div', { class: 'screen-inner' });
  inner.append(h('p', { class: 'lead' }, c.title), h('h1', { tabindex: '-1', class: 'question' }, c.question), h('p', { class: 'lead' }, c.lead2));
  const list = h('div', { class: 'choice-grid' });
  const next = bigBtn(c.next, () => go('final', 1), { iconRight: 'arrowRight', disabled: true });
  const draw = () => {
    list.replaceChildren(...c.actions.map(a => choiceBtn({
      emoji: a.emoji, label: a.label, selected: S.actions.includes(a.id),
      onclick: () => { toggle(S.actions, a.id); draw(); },
    })));
    next.disabled = S.actions.length === 0;
  };
  draw();
  inner.append(h('div', { class: 'final-grid' }, h('div', { class: 'photo-frame small' }, photoEl()), list));
  if (state.firstChoice) {
    const first = C.choose.items.find(i => i.id === state.firstChoice);
    inner.append(h('p', { class: 'first-note' }, icon('info'), c.first(`${first.emoji} ${first.label}`)));
  }
  return screenEl(inner, [next]);
}

/* =====================================================================
   8. 起動
   ===================================================================== */
const VIEWS = {
  start: startView,
  choose: chooseView,
  send: s => experienceView(EXP.send, s),
  cloud: s => experienceView(EXP.cloud, s),
  publish: s => experienceView(EXP.publish, s),
  compare: compareView,
  common: commonView,
  words: wordsView,
  final: finalView,
};

document.getElementById('btn-back').addEventListener('click', back);
render();

})();
