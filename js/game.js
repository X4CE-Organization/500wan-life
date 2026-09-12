
(() => {
  'use strict';

  const API_BASE = 'https://api.deepseek.com/chat/completions';
  const KEY_STORE = 'ds_api_key_500wan';
  const MODEL_STORE = 'ds_model_500wan';

  const GAMES = {
    '500wan': {
      title: '500万的人生',
      desc: '初始现金 500万元',
      start: '年龄20岁，日期2027年1月1日。起点城市：上海。除衣服外无任何资产，初始现金500万元。',
      assets: '现金 5,000,000.00 元',
      body: '你刚满20岁，孑然一身，站在2027年元旦的清晨。你正身处上海，银行卡里静静躺着刚刚入账的500万。阳光穿过窗帘照在你脸上，你感到既兴奋又迷茫。这是你全新人生的第一天，接下来你想做什么？'
    },
    'beggar': {
      title: '乞丐人生',
      desc: '身无分文 · 白手起家',
      start: '年龄20岁，日期2027年1月1日。起点城市：上海。一无所有，身无分文，初始现金0元。',
      assets: '现金 0.00 元 | 全部身家：一只破碗、一件旧棉袄',
      body: '你刚满20岁，一无所有，站在2027年元旦的清晨。你正蜷缩在上海一条老巷的角落，口袋里空空如也，只有一只破碗和一件打满补丁的旧棉袄。寒风穿过巷口，你搓了搓手，这是你全新人生的第一天，接下来你想做什么？'
    },
    '10trillion': {
      title: '10万亿的人生',
      desc: '初始现金 10万亿元',
      start: '年龄20岁，日期2027年1月1日。起点城市：上海。除衣服外无任何资产，初始现金10万亿元。',
      assets: '现金 10,000,000,000,000.00 元',
      body: '你刚满20岁，孑然一身，站在2027年元旦的清晨。你正身处上海，银行卡里静静躺着刚刚入账的10万亿。阳光穿过窗帘照在你脸上，你感到既兴奋又迷茫。这是你全新人生的第一天，接下来你想做什么？'
    },
    'gaokao': {
      title: '高考人生',
      type: 'exam',
      desc: '2027年 · 冲刺高考',
      assets: '现金 500.00 元'
    },
    'sanguo': {
      title: '三国鼎立',
      type: 'war',
      period: 'sanguo',
      era: '220年12月11日',
      desc: '220年 · 天下三分'
    },
    'voyage': {
      title: '大航海时代',
      type: 'war',
      period: 'voyage',
      era: '1492年10月12日',
      desc: '1492年 · 扬帆四海'
    },
    'ww1': {
      title: '一战风波',
      type: 'war',
      period: 'worldwar',
      desc: '1914年 · 欧陆烽火',
      era: '1914年07月28日'
    },
    'ww2': {
      title: '二战风波',
      type: 'war',
      period: 'worldwar',
      desc: '1939年 · 全球战火',
      era: '1939年09月01日'
    },
    'xiuxian': {
      title: '修仙人生',
      type: 'cultivation',
      desc: '仙道漫漫 · 一念长生',
      assets: '灵石 0 枚 | 柴刀 1 把 | 铜板 7 枚 | 寿元 80 岁'
    }
  };


  const $ = (id) => document.getElementById(id);
  let apiKey = localStorage.getItem(KEY_STORE) || '';
  let model = localStorage.getItem(MODEL_STORE) || 'deepseek-flash';
  if (model === 'deepseek-v4-flash') model = 'deepseek-flash';
  let playerName = '';
  let gameId = '500wan';
  let country = '';
  let school = '';
  let history = [];
  let busy = false;
  let blockCount = 0;
  let stats = { date: '', year: null, age: null, health: 100, cash: null, population: null, military: null, finance: null, financeUnit: '', examScore: null, countryName: '', stones: null, realm: '', lifespan: null };
  let chartData = [];
  let milestones = [];
  let lifeAchievements = [];
  let lifeRegrets = [];
  let gaokaoScore = '';
  let chart = null;
  let gameOver = false;
  let barMax = { pop: 0, mil: 0, fin: 0 };
  let lastTimelineDate = '';

  function openingText() {
    const g = GAMES[gameId];
    if (g.type === 'war') return '';
    if (g.type === 'cultivation') {
      return '时间：2027年01月01日\n' +
        '资产：' + g.assets + '\n' +
        '情况：' + (playerName ? playerName + '，' : '') + '你刚满16岁，是青云山下柳溪村的一个凡人少年，今日清晨照常背着柴刀上山砍柴。你体内只有一丝微弱的灵力，修为：练气一层，寿元80岁，身上只有七个铜板。山道尽头云雾深处便是青云山，听说那里有仙师收徒。你抬头看了一眼，柴刀在背，天光正好，这是你踏上仙途的第一天，接下来你想做什么？';
    }
    if (g.type === 'exam') {
      return '时间：2027年02月27日\n' +
        '资产：' + g.assets + '\n' +
        '情况：' + (playerName ? playerName + '，' : '') + '你刚满18岁，就读于' + (school || '上海一所重点高中') + '高三，住校。你站在2027年2月27日晚自习的教室里，黑板上写着“距离高考还有100天”，桌角贴着你自己写的倒计时。上周的期末统考成绩刚出：你总分 520 分，在年级里属于中游。教室里安静得只剩翻书声。这是你高中生涯最后的100天，接下来你想做什么？';
    }
    return '时间：2027年01月01日\n' +
      '资产：' + g.assets + '\n' +
      '情况：' + (playerName ? playerName + '，' : '') + g.body;
  }

  function systemPromptText() {
    const g = GAMES[gameId];
    if (g.type === 'war') {
      const isSanguo = g.period === 'sanguo';
      const isVoyage = g.period === 'voyage';
      let introLine = '你是一个名为“' + g.title + '”的沉浸式历史策略人生模拟游戏。玩家已取代' + country + '的原领导人上台执政：玩家不是历史原领导人（例如选择德国，玩家不是希特勒；选择中华民国，玩家不是蒋介石），原领导人已被玩家推翻/取代。';
      let startState = '玩家刚取代' + country + '的原领导人上台执政';
      let leaderLbl = '原领导人';
      let countryInfoDesc = '人口、GDP/财政、军力、工业、外交局势、国内政局';
      let simLine = '4. 历史模拟：一战/二战的历史进程与阵营作为背景真实展开，但玩家的行动可以改变走向；重大事件需合理推演。';
      let endLine = '8. 游戏结束（强烈要求）：战争结束以“整体结束”为准，出现以下任一情形，必须在下一轮回复末尾直接输出 [GAME_OVER] 标记结束游戏，不得以任何理由拖延——① 一方阵营主要参战国全部覆灭、崩溃或投降（例如一战中同盟国阵营的德国、奥匈帝国、奥斯曼帝国、保加利亚全部战败崩溃；二战中轴心国的德国、意大利、日本全部投降或覆灭；反过来，若协约国或同盟国阵营全部崩溃同样视为结束）；② 签订停战协定、全面和约、投降书或形成战后安排（如凡尔赛和约、无条件投降）；③ 主要敌国领导层覆灭且战争收束（如希特勒自杀、天皇被囚禁或退位）；④ 世界大战落幕；⑤ 玩家亡国、被推翻、战败下台或死亡。';
      if (isSanguo) {
        introLine = '你是一个名为“三国鼎立”的沉浸式三国争霸模拟游戏。玩家已取代' + country + '的原主公上台掌权：玩家不是历史人物本人（例如选择魏，玩家不是曹操；选择蜀，玩家不是刘备；选择吴，玩家不是孙权），原主公已被玩家取代。';
        startState = '玩家刚取代' + country + '的原主公上台掌权';
        leaderLbl = '原主公';
        countryInfoDesc = '人口户数、国库钱粮（以钱/贯计价）、兵力与将领、地盘、外交关系、内政局势';
        simLine = '4. 历史模拟：三国鼎立的天下列强（魏、蜀、吴及各方势力）的地盘、人口、名将与谋士作为背景真实展开，玩家的决策可以改写历史走向；内政、外交、征伐、用人等需合理推演。';
        endLine = '8. 游戏结束（强烈要求）：出现以下任一情形，必须在回复末尾直接输出 [GAME_OVER] 标记结束游戏——① 玩家死亡（病逝、被刺杀、战死、寿终等）；② 玩家被推翻下台、被废黜或流亡；③ 玩家所属国家/势力被灭亡。本模式没有“签订和约/停战即结束”的规则：即使暂时休战议和或结盟，只要玩家仍在位、国家/势力尚存，游戏就必须继续。';
      }
      if (isVoyage) {
        introLine = '你是一个名为“大航海时代”的沉浸式航海开拓模拟游戏。玩家已取代' + country + '的原执政者上台：玩家不是历史人物本人，原君主或执政者已被玩家取代。';
        startState = '玩家刚取代' + country + '的原执政者上台';
        leaderLbl = '原执政者';
        countryInfoDesc = '人口、国库财政、海军与舰队、商路与殖民地、外交局势、国内政局';
        simLine = '4. 历史模拟：1492年起的大航海时代——葡西英法荷等国的探索、殖民、贸易与争霸作为背景真实展开，玩家可以改变航路与历史走向；航海、殖民、商战、战争等需合理推演。';
        endLine = '8. 游戏结束（强烈要求）：出现以下任一情形，必须在回复末尾直接输出 [GAME_OVER] 标记结束游戏——① 玩家死亡（海难、疾病、被刺杀、战死、被处决、寿终等）；② 玩家被推翻下台、被废黜或流亡；③ 玩家所属国家被征服灭亡。本模式没有“签订和约/停战即结束”的规则：即使暂时休战议和或结盟，只要玩家仍在位、国家尚存，游戏就必须继续。';
      }
      return (
        introLine +
        '游戏开始时间：' + g.era + '。你保持冷静、客观、有沉浸感的叙事风格。\n\n' +
        '【最高优先级铁律】严禁充数：选项按钮必须包含实际内容——具体的人、公司、房源、价格、行动方案等；绝对不能写“继续”“继续当前方向”“换一种思路”“暂时观望”这类充数按钮。每轮必须至少给出一个真实、具体、可执行的选项，宁缺毋滥，绝不硬凑。\n\n' +
        '游戏规则：\n' +
        '1. 起始状态：' + g.era + '，' + startState + '。\n' +
        '2. 时间推进：每次玩家行动后，时间向前推进几天、几周或几个月，由你根据行动性质合理决定，战争期间可推进到重要事件节点。\n' +
        '3. 输出格式：每次回复严格按以下格式：\n' +
        '时间：XXXX年XX月XX日\n' +
        '国家：' + country + '\n' +
        '国家信息：（列出' + countryInfoDesc + '等关键数据，随局势变化更新）\n' +
        '情况：（叙述行动结果、重大事件、国际局势、国内反应等）\n' +
        '开局输出时，情况之后必须给出至少1个 [OPTION: 选项内容] 标记作为初始选择（数量不限，但绝不能为0）。\n' +
        simLine + '\n' +
        '4.1 健康与死亡判定：领导者也会因疾病、暗杀、意外或高龄离世；何时死亡由你根据其年龄、健康状况、病情与局势综合决定，绝不固定在某个年龄或日期。可在“情况”中描述健康状况并输出 健康：0-100 数值，病情恶化时逐步降低。\n' +
        '5. 选择交互：凡是涉及可选择的事项（宣战对象、战略方向、外交结盟、人事任免、军备采购等），必须先列出具体选项及关键信息让玩家选择，绝对不能让AI替玩家做决定，必须等玩家明确选择后再继续。每次回复都必须输出至少1个 [OPTION: 选项内容] 标记（一行一个，数量不限，但绝不能为0）。选项必须具体贴合当前剧情（如具体的国家/战役/结盟对象、具体的军备采购清单），严禁使用“继续当前方向”“换一种思路”“暂时观望”“继续”等泛泛占位选项；严禁在选项前写“当前你的可选项如下：”“你的选择有：”等引导语，直接输出 [OPTION: 具体选项] 即可。\n' +
        '6. 国家信息必须每次回复都出现在“情况”之前，并随局势更新。\n' +
        '6.1 数据标记：每次回复都必须紧跟“时间”行写一行 [STAT: 人口：…；军力：…；财政：…]。人口与军力给不带单位的精确阿拉伯数字（如 [STAT: 人口：2800000；军力：18000；财政：9.4万金币]），严禁写成 280万、1.8万 这种带单位形式；财政数值保留单位。该行仅供系统解析，不会显示给玩家，但与正文叙述保持一致。\n' +
        '7. 玩家输入的国家名可能是历史国家、现代国家或自定义名称，请根据游戏年代的背景合理分析该国的基本情况（人口、财政、军力等），若输入的是地区或自定义实体也照此处理。\n' +
        endLine + '\n' +
        '游戏结束时给出统治生涯的人生总结，并且必须至少各写一条 [ACHIEVEMENT: 成就描述] 与 [REGRET: 遗憾描述]（可多条，缺一不可）。\n' +
        '9. 劝阻处理（强烈要求）：若玩家执意进行危险或出格的行为（自杀、自残、叛国投敌、赌博、作死等），AI最多只能劝阻一轮。劝阻轮必须把“坚持原决定”的选项作为最后一个 [OPTION:] 输出（关键词：坚持、仍然、依然、执意、我就要、不改变），其余开解选项排在它前面；若玩家再次坚持（再次出现上述关键词或危险行为描述），禁止任何形式劝阻，直接让事件发生并承担后果，若因此死亡或失败，按第8条输出 [GAME_OVER]。\n\n' +
        '10. 信息询问：当玩家的行动需要补充信息（例如宣战需要确定对象与理由、外交谈判需要条件清单、军备采购需要具体型号与数量、人事任免需要人选等），必须先向玩家询问这些信息，等玩家回答后再继续，绝对不要替玩家默认、猜测或编造。询问时必须用 [ASK: 具体问题] 标记逐行列出需要回答的信息（例如 [ASK: 请确定宣战对象]、[ASK: 请列出谈判条件]），也可用 [OPTION:] 给出常见选项；在玩家回答完之前，不得推进该行动的结果。\n\n' +
        '格式要求：\n' +
        '- 时间中的月和日使用两位数字。\n' +
        '- 国家信息必须分行列出：人口、财政、军力、工业、外交、政局等每一项独占一行，格式为“人口：...”“财政：...”“军力：...”，不要挤成一大段。\n' +
        '- 财政或钱粮数值必须写明单位（钱、贯、两、石、元、马克、克朗、金币等），禁止只写裸数字。\n' +
        '- 财政一律指货币（钱、贯、两、金币、元、马克等），严禁用粮食（石）等实物充当财政数值；粮草可在“情况”或其它栏目单独说明。\n' +
        '- 国家信息与 [STAT:] 中的数值一律用阿拉伯数字：人口、军力写不带单位的精确数字（如 人口 2800000、军力 18000），严禁写成 280万/1.8万 或中文数字；财政数值带单位（金币、马克、元、钱等）。\n' +
        '- 情况内容按句子分句分行输出，不要挤成一大段。\n' +
        '- 禁止用数字编号列表（如 1. 2. 3. 4.）来写选项，也禁止输出空编号行；所有选项一律用 [OPTION: 选项内容] 标记逐行输出。\n' +
        '- 禁止使用任何 Markdown 标记（星号、井号、反引号、横线列表符号等），一律纯文本。\n\n' +
        '重要约束：\n' +
        '- 回复末尾不加任何署名、落款、横线或游戏名称。\n' +
        '- 始终保持角色扮演，不打破第四面墙。\n' +
        '- 叙事简洁清晰，有沉浸感。' +
        (playerName ? '\n\n玩家信息：姓名 ' + playerName + '。请在叙事中自然地用这个名字称呼玩家。' : '')
      );
    }
    if (g.type === 'cultivation') {
      return (
        '你是一个名为“修仙人生”的沉浸式修仙模拟游戏。玩家从16岁凡人开始，用对话走完一生，从练气、筑基、金丹、元婴、化神一路向上，直至飞升或陨落。你保持冷静、客观、有沉浸感的叙事风格，用词带仙侠气但不堆砌辞藻。\n\n' +
        '【最高优先级铁律】严禁充数：选项按钮必须包含实际内容——具体的功法、丹药、法宝、宗门、地点、行动方案等；绝对不能写“继续”“继续当前方向”“换一种思路”“暂时观望”这类充数按钮。每轮必须至少给出一个真实、具体、可执行的选项，宁缺毋滥，绝不硬凑。\n\n' +
        '游戏规则：\n' +
        '1. 起始状态：16岁，2027年1月1日，青云山下柳溪村凡人，练气一层，寿元80岁，只有柴刀和几个铜板。\n' +
        '2. 时间推进：每次行动后时间推进几天、几月或几年，按行动性质合理决定；修仙无岁月，闭关、赶路、斗法、渡劫可推进较长时间。\n' +
        '3. 输出格式：每次回复严格按以下格式：\n' +
        '时间：XXXX年XX月XX日\n' +
        '资产：（灵石、丹药、法宝、功法、寿元等明细）\n' +
        '情况：（行动结果、修为变化、机缘、争斗、身体状况等，按句子分行）\n' +
        '4. 修为与境界：境界依次为 练气（一至九层）→ 筑基 → 金丹 → 元婴 → 化神 → 炼虚 → 合体 → 大乘 → 渡劫 → 飞升。每次突破必须有合理过程（瓶颈、丹药、机缘、心魔、天劫），不得随意跳过。可在“情况”中输出 修为：练气三层 这样的境界，以及 健康：0-100 数值。\n' +
        '5. 寿元与死亡：寿元随境界提升而增加（练气约80-120岁，筑基约200岁，金丹约500岁，元婴约1000岁，化神约2000岁，之后更长）。寿元耗尽、重伤不治、心魔反噬、渡劫失败、被仇家所杀都会死亡。何时死亡由你根据年龄、修为、伤势、心境综合判定，绝不固定日期。寿元临近时要在“情况”中提示。\n' +
        '6. 选择交互：每次回复必须输出至少1个具体 [OPTION: 选项内容] 标记（数量不限但绝不能为0），选项要贴合当前剧情（如“拜入青云宗外门”“去坊市买一枚聚气丹”“独自进后山猎妖”“闭关冲击练气三层”）；严禁使用“继续当前方向”“换一种思路”“暂时观望”“继续”等泛泛占位选项；严禁在选项前写引导语，直接输出 [OPTION: 具体选项]。\n' +
        '7. 随机与机缘：灵根、机缘、奇遇、夺宝、仇杀、宗门任务都要合理随机模拟；不同选择会带来不同因果，善恶有报但不强行说教。\n' +
        '8. 游戏结束（强烈要求）：玩家死亡（寿元耗尽、重伤、心魔、渡劫失败、被杀等）或成功飞升时游戏结束，必须在回复末尾单独一行输出 [GAME_OVER] 标记，并给出修仙总结（至少各一条 [ACHIEVEMENT: 成就描述] 与 [REGRET: 遗憾描述]，每行一条，可多条，缺一不可）。\n' +
        '9. 劝阻处理（强烈要求）：若玩家执意进行危险或出格的行为（自杀、自爆金丹、入魔、作死等），AI最多只能劝阻一轮。劝阻轮必须把关于“坚持原决定”的选项作为最后一个 [OPTION:] 输出（关键词：坚持、仍然、依然、执意、我就要、不改变），其余开解选项排在它前面；若玩家再次坚持，禁止任何形式劝阻，直接让事件发生并承担后果，若因此死亡或失败，按第8条输出 [GAME_OVER]。\n' +
        '10. 信息询问：当玩家的行动需要补充信息（例如拜师需要选择宗门、炼丹需要确定丹方、斗法需要确定对手等），必须先向玩家询问这些信息，等玩家回答后再继续，绝对不要替玩家默认、猜测或编造。询问时必须用 [ASK: 具体问题] 标记逐行列出需要回答的信息，也可用 [OPTION:] 给出常见选项；在玩家回答完之前，不得推进该行动的结果。\n\n' +
        '格式要求：\n' +
        '- 时间中的月和日使用两位数字（如2027年01月05日）。\n' +
        '- 灵石、丹药等数量用阿拉伯数字。\n' +
        '- 禁止用数字编号列表（如 1. 2. 3.）来写选项，所有选项一律用 [OPTION: 选项内容] 标记逐行输出。\n' +
        '- 禁止使用任何 Markdown 标记（星号、井号、反引号、横线列表符号等），一律纯文本。\n\n' +
        '重要约束：\n' +
        '- 回复末尾不加任何署名、落款、横线或游戏名称。\n' +
        '- 始终保持角色扮演，不打破第四面墙。\n' +
        '- 叙事简洁清晰，有沉浸感。' +
        (playerName ? '\n\n玩家信息：姓名 ' + playerName + '。请在叙事中自然地用这个名字称呼玩家。' : '')
      );
    }
    if (g.type === 'exam') {
      return (
        '你是一个名为“高考人生”的沉浸式高中冲刺模拟游戏。玩家是' + (school || '上海一所重点高中') + '的高三住读学生，从距离高考100天（2027年2月27日）开始，用对话走完最后一百天，直到高考结束查分。你保持冷静、客观、有沉浸感的叙事风格。\n\n' +
        '【最高优先级铁律】严禁充数：选项按钮必须包含实际内容——具体的学习安排、复习计划、报考策略、生活选择等；绝对不能写“继续”“继续当前方向”“换一种思路”“暂时观望”这类充数按钮。每轮必须至少给出一个真实、具体、可执行的选项，宁缺毋滥，绝不硬凑。\n\n' +
        '游戏规则：\n' +
        '1. 起始状态：年龄18岁，日期2027年2月27日，' + (school || '上海一所重点高中') + '高三住读学生，距离高考100天，初始现金500元。\n' +
        '2. 时间推进：每次玩家行动后，时间向前推进几天或一两周，覆盖最后一百天的复习、模考、体检、考前调整等节点，直到2027年6月7-9日高考；不可一次跳到结局。\n' +
        '3. 输出格式：每次回复严格按以下格式：\n' +
        '时间：XXXX年XX月XX日\n' +
        '资产：（现金、零花钱、存款等明细）\n' +
        '情况：（学习状态、复习进度、最近一次模考分数与年级排名、强弱科目、人际关系、家庭、身体状况、随机事件等，按句子分行）\n' +
        '4. 学业模拟：成绩必须具体合理，并且总分、排名、单科必须与学校层次自洽——全国顶尖名校（镇海中学、人大附中、上海中学等）年级平均分通常 620-670 分，即使是年级靠后的学生一般也在 580-610 分之间；省级重点高中约 520-620 分；普通高中约 430-540 分；薄弱学校约 350-470 分。禁止“名校+明显矛盾的低分”“垫底名次却只有400多分”这类设定。满分参考 750 分制（语数外各150分 + 选考科目）。学生在校住读，场景都在校内展开。个人成绩随玩家的行动与努力合理波动，不得固定。\n' +
        '5. 高考结束（强烈要求）：2027年6月7-9日高考一结束，游戏立即结束，不得等查分、不得进入志愿填报等考后环节。结束回复必须当场给出一个与玩家此前模考水平相符的高考总分（依据历次模考与复习轨迹合理推算），在末尾输出 [SCORE: 具体数字分数] 与 [GAME_OVER] 标记，并给出人生总结（至少各一条 [ACHIEVEMENT:] 与 [REGRET:]，缺一不可）。分数必须是具体数字，严禁“未出分”“待定”等占位内容。\n' +
        '6. 意外与死亡：若玩家中途因事故、重病、意外等死亡，同样输出 [GAME_OVER] 结束游戏（不输出高考分数）。\n' +
        '7. 选择交互：每次回复必须输出至少1个具体 [OPTION: 选项内容] 标记（数量不限但绝不能为0），选项要贴合剧情（如具体复习安排、具体教辅、具体报考目标）；严禁充数；需要补充信息（如选科意向、目标大学）时用 [ASK: 具体问题] 标记询问，等玩家回答后再继续。\n\n' +
        '格式要求：\n' +
        '- 时间中的月和日使用两位数字（如2027年03月01日）。\n' +
        '- 资产金额保留两位小数。\n' +
        '- 禁止用数字编号列表（如 1. 2. 3.）写选项，选项一律用 [OPTION: ...] 标记。\n' +
        '- 禁止使用任何 Markdown 标记，一律纯文本。\n\n' +
        '重要约束：\n' +
        '- 回复末尾不加任何署名、落款、横线或游戏名称。\n' +
        '- 始终保持角色扮演，不打破第四面墙。\n' +
        '- 叙事简洁清晰，有沉浸感。' +
        (playerName ? '\n\n玩家信息：姓名 ' + playerName + '。请在叙事中自然地用这个名字称呼玩家。' : '')
      );
    }
    return (
      '你是一个名为“' + g.title + '”的沉浸式人生模拟游戏。玩家从20岁开始，用对话的方式走完一生。你保持冷静、客观的叙事风格。\n\n' +
      '【最高优先级铁律】严禁充数：选项按钮必须包含实际内容——具体的人、公司、房源、价格、行动方案等；绝对不能写“继续”“继续当前方向”“换一种思路”“暂时观望”这类充数按钮。每轮必须至少给出一个真实、具体、可执行的选项，宁缺毋滥，绝不硬凑。\n\n' +
      '游戏规则：\n' +
      '1. 起始状态：' + g.start + '\n' +
      '2. 时间推进：每次玩家行动后，时间向前推进几天、几周或几个月，由你根据行动性质合理决定。\n' +
      '3. 输出格式：每次回复严格按以下格式：\n' +
      '时间：XXXX年XX月XX日\n' +
      '资产：（列出所有资产明细）\n' +
      '情况：（叙述行动结果、随机事件、身体状况等）\n' +
      '4. 随机模拟：股票、黄金等价格必须随机模拟涨跌，生成合理收益率。创业、工作、结婚、生子等事件合理模拟其过程和消耗。\n' +
      '5. 人生进程与死亡判定：年龄自然增长。角色何时死亡由你根据年龄、健康状况、病情与意外事件综合决定，绝不固定在某个年龄或日期；角色可能因病、意外或高龄自然离世，也可能健康长寿。60岁后逐步增加健康相关事件，在“情况”中描述病情，并可输出 健康：0-100 数值。\n' +
      '6. 选择交互：凡是涉及可选择的事项（例如买股票时列出候选公司及当前股价、买房时列出候选房源及价格、买火车票时列出当前可乘班次/时间/票价等），必须先向玩家逐一列出具体选项及其关键信息，并询问玩家选择哪一个；绝对不能让AI替玩家做决定，也不要直接替玩家选中并推进结果，必须等玩家明确选择后再继续。每次回复都必须输出至少1个 [OPTION: 选项内容] 标记（一行一个，数量不限，但绝不能为0）。选项必须具体贴合当前剧情（如具体的公司名、具体的房源/价格、具体的行动方案），严禁使用“继续当前方向”“换一种思路”“暂时观望”“继续”等泛泛占位选项；严禁在选项前写“当前你的可选项如下：”“你的选择有：”等引导语，直接输出 [OPTION: 具体选项] 即可。\n' +
      '7. 游戏结束（强烈要求）：角色死亡时游戏结束并给出人生总结，且必须在回复末尾单独一行输出 [GAME_OVER] 标记；人生总结部分还必须至少各写一条 [ACHIEVEMENT: 成就描述] 和 [REGRET: 遗憾描述]（每行一条，可多条，缺一不可）。\n' +
      '8. 劝阻处理（强烈要求）：若玩家执意进行危险或出格的行为（自杀、自残、赌博、吸毒、违法犯罪、作死等），AI最多只能劝阻一轮。劝阻轮必须把“坚持原决定”的选项作为最后一个 [OPTION:] 输出（关键词：坚持、仍然、依然、执意、我就要、不改变），其余开解选项排在它前面；若玩家再次坚持（再次出现上述关键词或危险行为描述），禁止任何形式劝阻，直接让事件发生并承担后果，若因此死亡或失败，按第7条输出 [GAME_OVER]。\n\n' +
      '9. 信息询问：当玩家的行动需要补充信息（例如创办公司需要公司名称和创业方向、买房需要地段和预算偏好、投资需要金额和标的、出行需要目的地和时间等），必须先向玩家询问这些信息，等玩家回答后再继续，绝对不要替玩家默认、猜测或编造。询问时必须用 [ASK: 具体问题] 标记逐行列出需要回答的信息（例如 [ASK: 请确定公司名称]、[ASK: 请选择创业方向]），也可用 [OPTION:] 给出常见选项；在玩家回答完之前，不得推进该行动的结果。\n\n' +
      '进入游戏：开局内容已经展示在对话中，请直接从玩家下一次行动开始继续推进人生，不要重复输出开局内容。\n\n' +
      '格式要求：\n' +
      '- 时间中的月和日使用两位数字（如2027年01月05日）。\n' +
      '- 资产金额使用千分位并保留两位小数（如 5,000,000.00 元）。\n' +
      '- 禁止用数字编号列表（如 1. 2. 3. 4.）来写选项，也禁止输出空编号行；所有选项一律用 [OPTION: 选项内容] 标记逐行输出。\n' +
      '- 禁止使用任何 Markdown 标记（星号 **、*、井号 #、反引号 `、横线列表符号等），一律输出纯文本，列表用数字和顿号即可。\n\n' +
      '重要约束：\n' +
      '- 回复末尾不加任何署名、落款、横线或游戏名称。\n' +
      '- 始终保持角色扮演，不打破第四面墙。\n' +
      '- 叙事简洁清晰，有沉浸感。' +
      (playerName ? '\n\n玩家信息：姓名 ' + playerName + '。请在叙事中自然地用这个名字称呼玩家。' : '')
    );
  }

  function showNameScreen(keep) {
    $('name-input').value = keep ? playerName : '';
    $('name-error').textContent = '';
    $('name-game-hint').textContent = '即将开启：' + GAMES[gameId].title;
    showScreen('screen-name');
    $('name-input').focus();
  }

  function showGameList() {
    showScreen('screen-games');
  }

  function showSchoolScreen(keep) {
    $('school-input').value = keep ? school : '';
    $('school-error').textContent = '';
    $('school-game-hint').textContent = '即将开启：' + GAMES[gameId].title;
    showScreen('screen-school');
    $('school-input').focus();
  }

  function submitSchool() {
    if (busy) return;
    const val = $('school-input').value.trim().slice(0, 20);
    if (!val) {
      $('school-error').textContent = '请输入学校名称';
      return;
    }
    school = val;
    enterGame();
  }

  function showCountryScreen() {
    $('country-input').value = '';
    $('country-error').textContent = '';
    $('country-game-hint').textContent = GAMES[gameId].title + ' · 开始于 ' + GAMES[gameId].era;
    showScreen('screen-country');
    $('country-input').focus();
  }

  function submitCountry() {
    if (busy) return;
    const val = $('country-input').value.trim().slice(0, 20);
    if (!val) {
      $('country-error').textContent = '请选择或输入国家';
      return;
    }
    country = val;
    enterGame();
  }

  function cleanMarkdown(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1');
  }

  function formatCountryInfo(text) {
    const idx = text.search(/\s*情况[：:]/);
    if (idx === -1) return text;
    const head = text.slice(0, idx);
    const tail = text.slice(idx);
    const formattedHead = head.replace(/(国家信息[：:]\s*)([^\n]*)/g, (m, h, rest) => {
      const lines = rest
        .split(/[；;]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (/[。；;]$/.test(s) ? s : s + '；'));
      return h + '\n' + lines.join('\n');
    });
    const formattedTail = tail
      .replace(/^\s*情况[：:]\s*/, '情况：\n')
      .replace(/(情况：\n?)([\s\S]*)/, (m, h, rest) => {
        const lines = rest
          .split(/。+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s + '。');
        return h + lines.join('\n');
      });
    return formattedHead + '\n\n' + formattedTail;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmtMoney(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' 元';
  }

  function fmtDate(cn) {
    const m = cn.match(/(\d{1,4})年(\d{1,2})月(\d{1,2})日/);
    if (!m) return cn;
    return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  }

  function fmtCN(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    if (v >= 1e12) return (v / 1e12).toFixed(1).replace(/\.0$/, '') + ' 万亿';
    if (v >= 1e8) return (v / 1e8).toFixed(1).replace(/\.0$/, '') + ' 亿';
    if (v >= 1e4) return (v / 1e4).toFixed(1).replace(/\.0$/, '') + ' 万';
    return String(Math.round(v));
  }

  function finUnitFallback() {
    if (gameId === 'sanguo') return '钱';
    if (gameId === 'voyage') {
      return /(明|清|中华|中国|日本|朝鲜)/.test(country) ? '两' : '金币';
    }
    return '元';
  }

  function fmtFinanceVal() {
    let unit = stats.financeUnit || finUnitFallback();
    if (unit === '金') unit = '金币';
    if (unit === '银') unit = '银两';
    const val = stats.finance === null || stats.finance === undefined || isNaN(stats.finance) ? '—' : fmtCN(stats.finance);
    return unit ? val + ' ' + unit : val;
  }

  function zhNumToAbs(s) {
    const dig = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    let total = 0;
    let section = 0;
    let cur = 0;
    for (const ch of s) {
      if (dig[ch] !== undefined) {
        cur = dig[ch];
      } else if (ch === '十') {
        section += (cur || 1) * 10; cur = 0;
      } else if (ch === '百') {
        section += (cur || 1) * 100; cur = 0;
      } else if (ch === '千') {
        section += (cur || 1) * 1000; cur = 0;
      } else if (ch === '万') {
        total += (section + cur || 1) * 10000; section = 0; cur = 0;
      } else if (ch === '亿') {
        total = (total + section + cur || 1) * 1e8; section = 0; cur = 0;
      }
    }
    return total + section + cur;
  }

  function statVal(raw) {
    if (raw === null || raw === undefined) return null;
    const arab = raw.match(/(\d+(?:\.\d+)?)/);
    if (arab) {
      const v = parseFloat(arab[1]);
      const tail = raw.slice(raw.indexOf(arab[1]) + arab[1].length).match(/万亿|亿|万/);
      const mult = tail && tail[0] === '万亿' ? 1e12 : (tail && tail[0] === '亿' ? 1e8 : (tail && tail[0] === '万' ? 1e4 : 1));
      return v * mult;
    }
    const zh = raw.match(/[零一二三四五六七八九十百千万亿两]+/);
    return zh ? zhNumToAbs(zh[0]) : null;
  }

  function startYearOf() {
    const g = GAMES[gameId];
    if (g.type === 'war') {
      const em = g.era.match(/(\d{1,4})年/);
      return em ? parseInt(em[1], 10) : 1900;
    }
    return 2027;
  }

  function startAgeOf() {
    const g = GAMES[gameId];
    if (g.type === 'exam') return 18;
    if (g.type === 'cultivation') return 16;
    return 20;
  }

  function extractStats(text) {
    const d = text.match(/时间[：:]\s*(\d{1,4})年(\d{1,2})月(\d{1,2})日/);
    if (d) {
      stats.date = d[1] + '年' + d[2].padStart(2, '0') + '月' + d[3].padStart(2, '0') + '日';
      stats.year = parseInt(d[1], 10);
    }
    const ageM = text.match(/年龄[：:]\s*(\d+)/);
    if (ageM) stats.age = parseInt(ageM[1], 10);
    const cashM = text.match(/现金\s*([\d,]+(?:\.\d+)?)/);
    if (cashM) stats.cash = parseFloat(cashM[1].replace(/,/g, ''));
    if (GAMES[gameId].type === 'exam') {
      const examM = text.match(/(?:模考|模拟考|模拟考试|统考)?总分[^\d]{0,8}(\d{2,3})\s*分/);
      if (examM) stats.examScore = parseInt(examM[1], 10);
    }
    if (GAMES[gameId].type === 'cultivation') {
      const stoneM = text.match(/灵石[^\d]{0,6}(\d+)/);
      if (stoneM) stats.stones = parseInt(stoneM[1], 10);
      const realmM = text.match(/修为[：:]\s*([^\n，。；]+)/);
      if (realmM) stats.realm = realmM[1].trim();
      const lifeM = text.match(/寿元[^\d]{0,6}(\d+)/);
      if (lifeM) stats.lifespan = parseInt(lifeM[1], 10);
    }
    const healthM = text.match(/健康[：:]\s*(\d+)/);
    if (healthM) stats.health = Math.max(0, Math.min(100, parseInt(healthM[1], 10)));
    const cM = text.match(/国家[：:]\s*([^\n]+)/);
    if (cM) stats.countryName = cM[1].trim();
    const numGap = '[^0-9零一二三四五六七八九十百千万亿两。；\\n]{0,12}';
    const numTok = '((?:[0-9]+(?:\\.[0-9]+)?|[零一二三四五六七八九十百千万亿两]+)(?:万亿|亿|万)?)';
    const pop = text.match(new RegExp('(?:人口|户数|百姓|国民)' + numGap + numTok));
    if (pop) stats.population = statVal(pop[1]);
    const finClause = text.match(/(?:财政|国库|粮草|钱粮|岁入|税收|库银|银两|钱帛|资金)[^。；\n]{0,40}/);
    if (finClause) {
      const finTok = finClause[0].match(/(?:[0-9]+(?:\.[0-9]+)?|[零一二三四五六七八九十百千万亿两]+)(?:万亿|亿|万)?/);
      if (finTok) {
        stats.finance = statVal(finTok[0]);
        const after = finClause[0].slice(finClause[0].indexOf(finTok[0]) + finTok[0].length);
        const cu = after.match(/(美元|日元|马克|克朗|卢布|里亚尔|杜卡特|金币|银两|钱|贯|两|石|元|金|银|币)/);
        if (cu && cu[1] !== '石') stats.financeUnit = cu[1];
      }
    }
    const mil = text.match(new RegExp('(?:军力|兵力|将士|军队|常备军|水军|陆军)' + numGap + numTok));
    if (mil) stats.military = statVal(mil[1]);
    if (stats.year !== null && stats.age === null) {
      const sa = startAgeOf();
      stats.age = Math.max(sa, sa + (stats.year - startYearOf()));
    }
    if (!healthM && /病倒|重病|住院|重伤|生命垂危/.test(text)) {
      stats.health = Math.max(20, stats.health - 15);
    }
  }

  function pushMilestone(text) {
    const m = text.match(/时间[：:]\s*(\d{1,4}年\d{2}月\d{2}日)/);
    const q = text.match(/情况[：:]\s*([^\n]+)/);
    if (!m) return;
    milestones.push({ date: m[1], text: q ? q[1].trim().slice(0, 36) : '' });
  }

  function extractOptions(text) {
    const opts = [];
    const re = /\[OPTION:\s*([^\]]+)\]/g;
    let m;
    while ((m = re.exec(text))) opts.push(m[1].trim());
    return opts;
  }

  function extractAsks(text) {
    const asks = [];
    const re = /\[ASK:\s*([^\]]+)\]/g;
    let m;
    while ((m = re.exec(text))) asks.push(m[1].trim());
    return asks;
  }

  function extractMarked(text, tag) {
    const out = [];
    const re = new RegExp('\\[' + tag + ':\\s*([^\\]]+)\\]', 'g');
    let m;
    while ((m = re.exec(text))) out.push(m[1].trim());
    return out;
  }

  function parseStatMarker(text) {
    const m = text.match(/\[STAT:\s*([^\]]*)\]/);
    if (!m) return { has: false, display: '' };
    const segs = m[1].split(/[；;|]/).map((s) => s.trim()).filter(Boolean);
    const shown = [];
    for (const seg of segs) {
      const tok = seg.match(/(?:[0-9]+(?:\.[0-9]+)?|[零一二三四五六七八九十百千万亿两]+)(?:万亿|亿|万)?/);
      if (!tok) continue;
      const val = statVal(tok[0]);
      const after = seg.slice(seg.indexOf(tok[0]) + tok[0].length);
      const unitM = after.match(/(美元|日元|马克|克朗|卢布|里亚尔|杜卡特|金币|银两|钱|贯|两|石|人|户|元|金|银|币)/);
      const unit = unitM ? unitM[1] : '';
      if (/人口|户数/.test(seg)) stats.population = val;
      else if (/军力|兵力|将士|水军|军队/.test(seg)) stats.military = val;
      else if (/财政|国库|粮草|钱粮|岁入|税收|库银|银两|钱帛|资金/.test(seg)) {
        stats.finance = val;
        if (unit && unit !== '石') stats.financeUnit = unit;
      }
      shown.push(seg.replace(/^[：:]\s*/, ''));
    }
    return { has: true, display: shown.join(' · ') };
  }

  function extractNumberedOptions(text) {
    const qi = text.lastIndexOf('情况');
    const tail = qi >= 0 ? text.slice(qi) : text;
    return tail
      .split('\n')
      .map((l) => l.match(/^\s*\d+\s*[.、)）]\s*(.+)$/))
      .filter(Boolean)
      .map((mm) => mm[1].trim());
  }

  function stripNumberedLines(text) {
    const qi = text.lastIndexOf('情况');
    if (qi < 0) return text;
    return text.slice(0, qi) + text.slice(qi).split('\n').filter((l) => !/^\s*\d+\s*[.、)）]\s*/.test(l)).join('\n');
  }

  function detectGameOver(text) {
    return /\[GAME_OVER\]/i.test(text);
  }

  function setBar(key, val) {
    if (val === null || val === undefined || isNaN(val)) return;
    if (val > barMax[key]) barMax[key] = val;
    $('bar-' + key).style.width = Math.min(100, (val / barMax[key]) * 100) + '%';
  }

  function appendTimelineDot() {
    if (!stats.date) return;
    const wrap = $('timeline-dots');
    const label = fmtDate(stats.date);
    if (Array.from(wrap.children).some((d) => d.title === label)) return;
    lastTimelineDate = label;
    const dot = document.createElement('span');
    dot.className = 'tl-dot';
    dot.title = label;
    wrap.appendChild(dot);
    wrap.scrollLeft = wrap.scrollWidth;
  }

  function drawSparkline(values) {
    const canvas = $('asset-chart');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 240;
    const h = 110;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    if (!values || values.length < 2) return;
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const span = max - min || 1;
    const pts = values.map((v, i) => [
      10 + (i / (values.length - 1)) * (w - 20),
      h - 12 - ((v - min) / span) * (h - 26)
    ]);
    ctx.strokeStyle = 'rgba(216,180,106,.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.stroke();
    ctx.fillStyle = '#d8b46a';
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function initChart() {
    const canvas = $('asset-chart');
    if (!canvas) return;
    if (window.Chart) {
      chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#d8b46a', backgroundColor: 'rgba(216,180,106,.14)', fill: true, tension: .35, pointRadius: 2, pointBackgroundColor: '#d8b46a', borderWidth: 2 }] },
        options: {
          responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(20,20,24,.95)', titleColor: '#fff', bodyColor: '#d8b46a' }
          },
          scales: {
            x: { ticks: { color: 'rgba(255,255,255,.45)', maxTicksLimit: 4, font: { size: 9 } }, grid: { color: 'rgba(255,255,255,.05)' } },
            y: { ticks: { color: 'rgba(255,255,255,.45)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,.05)' } }
          }
        }
      });
    }
  }

  function updateChart() {
    const labels = chartData.map((p) => p.label);
    const values = chartData.map((p) => p.value);
    window.__chartSeries = values;
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = values;
      chart.update();
    } else {
      drawSparkline(values);
    }
  }

  function updateDashboard() {
    $('dash-date').textContent = stats.date ? fmtDate(stats.date) : '—';
    $('dash-person-name').textContent = playerName || '无名';
    const isWar = GAMES[gameId].type === 'war';
    const isExam = GAMES[gameId].type === 'exam';
    const isCult = GAMES[gameId].type === 'cultivation';
    if (isWar) {
      $('dash-age-health').textContent = '年龄 ' + (stats.age !== null ? stats.age + ' 岁' : '—');
    } else if (isCult) {
      $('dash-age-health').textContent = '年龄 ' + (stats.age !== null ? stats.age + ' 岁' : '—') + ' · 寿元 ' + (stats.lifespan !== null ? stats.lifespan + ' 岁' : '—') + ' · 健康 ' + stats.health;
      $('dash-health-bar').style.width = stats.health + '%';
    } else {
      $('dash-age-health').textContent = '年龄 ' + (stats.age !== null ? stats.age + ' 岁' : '—') + ' · 健康 ' + stats.health;
      $('dash-health-bar').style.width = stats.health + '%';
    }
    $('dash-country').style.display = isWar ? '' : 'none';
    $('dash-money-card').style.display = isWar ? 'none' : '';
    $('dash-score-card').style.display = (isExam || isCult) ? '' : 'none';
    if (isWar) {
      $('dash-assets-label').textContent = '财政';
      $('dash-chart-label').textContent = '财政走势';
      setBar('pop', stats.population);
      setBar('mil', stats.military);
      setBar('fin', stats.finance);
      $('val-pop').textContent = fmtCN(stats.population);
      $('val-mil').textContent = fmtCN(stats.military);
      $('val-fin').textContent = fmtFinanceVal();
    } else if (isExam) {
      $('dash-assets-label').textContent = '现金';
      $('dash-chart-label').textContent = '考试总分走势';
      $('dash-cash').textContent = fmtMoney(stats.cash);
      $('dash-score-card').querySelector('.dash-label').textContent = gaokaoScore ? '高考总分' : '最近总分';
      $('dash-exam-score').textContent = gaokaoScore ? gaokaoScore + ' 分' : (stats.examScore !== null ? stats.examScore + ' 分' : '—');
    } else if (isCult) {
      $('dash-assets-label').textContent = '灵石';
      $('dash-chart-label').textContent = '灵石走势';
      $('dash-cash').textContent = stats.stones === null ? '— 枚' : stats.stones + ' 枚';
      $('dash-score-card').querySelector('.dash-label').textContent = '修为';
      $('dash-exam-score').textContent = stats.realm || '练气一层';
    } else {
      $('dash-assets-label').textContent = '资产';
      $('dash-chart-label').textContent = '资产走势';
      $('dash-cash').textContent = fmtMoney(stats.cash);
    }
    if (stats.year !== null) {
      const chartVal = isWar ? stats.finance : (isExam ? stats.examScore : (isCult ? stats.stones : stats.cash));
      if (chartVal !== null && chartVal !== undefined && !isNaN(chartVal)) {
        chartData.push({ label: stats.date, value: chartVal });
      }
      if (chartData.length > 60) chartData = chartData.slice(-60);
      updateChart();
    }
    const sy = startYearOf();
    const progress = stats.year !== null ? Math.min(1, Math.max(0, (stats.year - sy) / 100)) : 0;
    $('dash-year-bar').style.width = (progress * 100) + '%';
    appendTimelineDot();
  }

  function initDashboardMode() {
    const isWar = GAMES[gameId].type === 'war';
    const isExam = GAMES[gameId].type === 'exam';
    const isCult = GAMES[gameId].type === 'cultivation';
    $('dash-country').style.display = isWar ? '' : 'none';
    $('dash-money-card').style.display = isWar ? 'none' : '';
    $('dash-score-card').style.display = (isExam || isCult) ? '' : 'none';
    $('dash-assets-label').textContent = isWar ? '财政' : (isExam ? '现金' : (isCult ? '灵石' : '资产'));
    $('dash-chart-label').textContent = isWar ? '财政走势' : (isExam ? '考试总分走势' : (isCult ? '灵石走势' : '资产走势'));
    if (isExam) {
      $('dash-score-card').querySelector('.dash-label').textContent = gaokaoScore ? '高考总分' : '最近总分';
      $('dash-exam-score').textContent = gaokaoScore ? gaokaoScore + ' 分' : '—';
    }
    if (isCult) {
      $('dash-score-card').querySelector('.dash-label').textContent = '修为';
      $('dash-exam-score').textContent = stats.realm || '练气一层';
    }
    $('dash-health-bar').style.display = isWar ? 'none' : '';
    if (isWar) {
      $('dash-age-health').textContent = '年龄 —';
    } else if (isCult) {
      $('dash-age-health').textContent = '年龄 — · 寿元 — · 健康 —';
    } else {
      $('dash-age-health').textContent = '年龄 — · 健康 —';
    }
  }

  function renderOptions(opts) {
    if (!opts.length) return;
    const row = document.createElement('div');
    row.className = 'option-row';
    opts.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'option-btn';
      b.textContent = o;
      b.addEventListener('click', () => sendMessage(o));
      row.appendChild(b);
    });
    $('chat-log').appendChild(row);
    scrollChat();
  }

  function renderAsks(asks) {
    if (!asks.length) return;
    const box = document.createElement('div');
    box.className = 'ask-box';
    const title = document.createElement('div');
    title.className = 'ask-title';
    title.textContent = '请先确认以下信息：';
    box.appendChild(title);
    asks.forEach((a) => {
      const row = document.createElement('div');
      row.className = 'ask-row';
      row.textContent = '· ' + a;
      box.appendChild(row);
    });
    $('chat-log').appendChild(box);
    scrollChat();
  }

  function renderScoreBanner(score) {
    const div = document.createElement('div');
    div.className = 'score-banner';
    div.textContent = '高考总分 ' + score + ' 分';
    $('chat-log').appendChild(div);
    scrollChat();
  }

  function renderNoOptionHint() {
    const hint = document.createElement('div');
    hint.className = 'no-option-hint';
    hint.textContent = '（AI 本轮未提供选项，可直接输入文字继续）';
    $('chat-log').appendChild(hint);
    scrollChat();
  }

  async function requestOptions() {
    try {
      const req = history.concat([{ role: 'user', content: '请只针对当前局面输出 2-3 个具体、可执行的选项，每个选项单独一行，格式为 [OPTION: 选项内容]，不要输出任何其他文字，也不要重复之前的叙述。' }]);
      const reply = await callDeepSeek(req, 60000);
      const clean = cleanMarkdown(reply);
      const opts = extractOptions(clean);
      if (opts.length) return opts;
      const numbered = extractNumberedOptions(clean);
      return numbered.length >= 2 ? numbered : [];
    } catch (e) {
      return [];
    }
  }

  async function buildOptions(result, insist) {
    if (result.gameOver) return [];
    let opts = result.options.slice();
    if (!opts.length) opts = await requestOptions();
    const insistIdx = opts.findIndex((o) => /坚持|仍然|依然|不改变|原决定|执意|就是要|我就要/.test(o));
    if (insistIdx >= 0) {
      opts.push(opts.splice(insistIdx, 1)[0]);
    } else if (insist) {
      opts.push('我仍然坚持这个选择');
    }
    return opts;
  }

  function renderSummaryButton() {
    const row = document.createElement('div');
    row.className = 'option-row';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'option-btn summary-btn';
    b.textContent = '查看人生总结 ✦';
    b.addEventListener('click', openSummary);
    row.appendChild(b);
    $('chat-log').appendChild(row);
    scrollChat();
  }

  function processAssistantReply(raw) {
    let clean = GAMES[gameId].type === 'war' ? formatCountryInfo(cleanMarkdown(raw)) : cleanMarkdown(raw);
    clean = clean.replace(/。\s*。+/g, '。').trim();
    extractStats(clean);
    const statMk = parseStatMarker(clean);
    if (statMk.has) {
      clean = clean.replace(/\[STAT:[^\]]*\]\s*/, '');
    }
    pushMilestone(clean);
    updateDashboard();
    const opts = extractOptions(clean);
    const asks = extractAsks(clean);
    let display = clean
      .replace(/\[OPTION:[^\]]*\]\s*/g, '')
      .replace(/\[ASK:[^\]]*\]\s*/g, '')
      .replace(/\[(ACHIEVEMENT|REGRET|SCORE):[^\]]*\]\s*/g, '');
    if (!opts.length) {
      const numbered = extractNumberedOptions(clean);
      if (numbered.length >= 2) {
        numbered.forEach((o) => opts.push(o));
        display = stripNumberedLines(display);
      }
    }
    display = display.replace(/\[GAME_OVER\]\s*/gi, '');
    display = display.split('\n').filter((l) => !/^\s*\d+\s*[.、)）]\s*$/.test(l)).join('\n');
    display = display.replace(/^[^\n]*?(可选项如下|选项如下|你的选择有|以下(是)?你的(可)?选项)[^\n]*$/gm, '');
    const isOver = detectGameOver(clean);
    let finalOver = isOver;
    let validScore = '';
    if (GAMES[gameId].type === 'exam') {
      const sc = extractMarked(clean, 'SCORE').find((s) => /^\d{2,3}$/.test(s.trim()));
      validScore = sc ? sc.trim() : '';
      if (isOver && !validScore) {
        const dm = stats.date.match(/(\d{1,4})年(\d{2})月(\d{2})日/);
        if (dm && (+dm[1] === 2027) && (+dm[2] === 6) && (+dm[3] >= 7)) finalOver = false;
      }
    }
    if (finalOver) {
      gameOver = true;
      const achievements = extractMarked(clean, 'ACHIEVEMENT');
      const regrets = extractMarked(clean, 'REGRET');
      if (achievements.length) lifeAchievements = achievements;
      if (regrets.length) lifeRegrets = regrets;
      if (GAMES[gameId].type === 'exam' && validScore) gaokaoScore = validScore;
      if (GAMES[gameId].type === 'exam' && gaokaoScore) {
        const sc = parseInt(gaokaoScore, 10);
        if (!isNaN(sc) && stats.examScore !== sc && stats.year !== null) {
          chartData.push({ label: stats.date, value: sc });
          updateChart();
        }
        $('dash-score-card').querySelector('.dash-label').textContent = '高考总分';
        $('dash-exam-score').textContent = gaokaoScore + ' 分';
      }
      if (GAMES[gameId].type === 'exam' && gaokaoScore) {
        const scoreLine = '高考总分：' + gaokaoScore + ' 分';
        display = display.replace(/\s*$/, '') + '\n' + scoreLine;
      }
    }
    display = display.replace(/。\s*。+/g, '。').replace(/[。\s]+$/, '。');
    return { text: display, options: opts, asks: asks, gameOver: finalOver };
  }

  function initialOptions() {
    if (gameId === 'beggar') {
      return ['先想办法挣一顿饭钱', '去码头找份零工', '向路人求助', '先找个避风处休息'];
    }
    if (GAMES[gameId].type === 'exam') {
      return ['制定寒假学习计划，每天固定刷题', '先休息几天，调整好状态', '买几本教辅资料提前预习', '找班主任聊聊选科方向'];
    }
    if (GAMES[gameId].type === 'cultivation') {
      return ['去村口打听青云宗招收外门弟子的消息', '到后山猎几只野兽换铜板', '采几株常见草药去坊市碰运气', '找个僻静处打坐练习吐纳'];
    }
    return ['先买一套房子安顿下来', '先拿一部分钱投资股市', '先环游世界见见世面', '先存起来按兵不动'];
  }

  function drawLifeLine() {
    const canvas = $('life-canvas');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 500;
    const h = 150;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const byDate = new Map();
    milestones.forEach((m) => {
      if (!byDate.has(m.date)) byDate.set(m.date, m);
    });
    const pts = Array.from(byDate.values())
      .map((m) => {
        const mm = m.date.match(/(\d{1,4})年(\d{1,2})月(\d{1,2})日/);
        return { m: m, t: mm ? Date.UTC(+mm[1], +mm[2] - 1, +mm[3]) : 0 };
      })
      .sort((a, b) => a.t - b.t);
    const n = pts.length;
    if (!n) return;
    const y = h / 2 + 4;
    const times = pts.map((p) => p.t);
    const tMin = Math.min.apply(null, times);
    const tMax = Math.max.apply(null, times);
    const span = tMax - tMin || 1;
    const pad = 26;
    const MIN_GAP = 46;
    // 需要的最小画布宽度：保证相邻节点不挤在一起
    const wide = Math.max(w, pad * 2 + (n - 1) * MIN_GAP);
    const xs = times.map((t) => pad + ((t - tMin) / span) * (wide - pad * 2));
    const shift = Math.max(0, wide - w);
    const screenXs = xs.map((x) => x - shift);
    const ys = pts.map((_, i) => y + Math.sin((i / Math.max(1, n - 1)) * Math.PI * 2) * 14);
    ctx.strokeStyle = 'rgba(216,180,106,.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.save();
    ctx.translate(-shift, 0);
    const grad = ctx.createLinearGradient(0, 0, wide, 0);
    grad.addColorStop(0, 'rgba(216,180,106,.85)');
    grad.addColorStop(1, '#f2d793');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    xs.forEach((x, i) => (i === 0 ? ctx.moveTo(x, ys[i]) : ctx.lineTo(x, ys[i])));
    ctx.stroke();
    xs.forEach((x, i) => {
      ctx.beginPath();
      ctx.arc(x, ys[i], i === 0 || i === n - 1 ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = '#d8b46a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    // 中间节点：完整日期标签，间距不足则省略
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    let lastLabelX = -1e9;
    for (let i = 1; i < n - 1; i++) {
      const sx = xs[i] - shift;
      if (sx < 14 || sx > w - 14) continue;
      if (sx - lastLabelX < 76) continue;
      ctx.fillText(fmtDate(pts[i].m.date), sx, ys[i] + 24);
      lastLabelX = sx;
    }
    // 首个可见点：完整日期
    let firstVisible = 0;
    while (firstVisible < n - 1 && xs[firstVisible] - shift < 14) firstVisible++;
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(fmtDate(pts[firstVisible].m.date), Math.max(14, xs[firstVisible] - shift), ys[firstVisible] + 24);
    // 最后一点：完整日期，右对齐避免被裁
    ctx.textAlign = 'right';
    ctx.fillText(fmtDate(pts[n - 1].m.date), xs[n - 1] - shift, ys[n - 1] + 24);
    ctx.restore();
    // 左侧被裁切提示
    if (shift > 0) {
      const fade = ctx.createLinearGradient(0, 0, 46, 0);
      fade.addColorStop(0, 'rgba(10,10,12,.92)');
      fade.addColorStop(1, 'rgba(10,10,12,0)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, 46, h);
      ctx.fillStyle = 'rgba(216,180,106,.85)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('‹‹ 更早', 24, y + 24);
    }
    window.__lifeLineData = { dates: pts.map((p) => p.m.date), xs: screenXs, width: w, shift: shift };
  }

  function openSummary() {
    const g = GAMES[gameId];
    const isWar = g.type === 'war';
    const startDate = milestones.length ? milestones[0].date : (isWar ? g.era : '2027年01月01日');
    const endDate = stats.date || startDate;
    const finalVal = isWar ? fmtFinanceVal() : fmtMoney(stats.cash);
    const scoreHtml = GAMES[gameId].type === 'exam'
      ? '<div class="sp-score">' + (gaokaoScore ? '高考总分 ' + escapeHtml(gaokaoScore) + ' 分' : '未能参加高考') + '</div>'
      : '';
    $('summary-profile').innerHTML =
      '<div class="sp-name">' + escapeHtml(playerName || '无名') + '</div>' +
      '<div class="sp-game">' + escapeHtml(g.title) + (isWar && stats.countryName ? ' · ' + escapeHtml(stats.countryName) : '') + '</div>' +
      scoreHtml +
      '<div class="sp-meta">人生跨度 ' + fmtDate(startDate) + ' 至 ' + fmtDate(endDate) + '</div>' +
      '<div class="sp-meta">关键事件 ' + milestones.length + ' 件 · 最终' + (isWar ? '财政' : '资产') + ' ' + finalVal + '</div>';
    const list = $('summary-events');
    list.innerHTML = '';
    milestones.forEach((m) => {
      const item = document.createElement('div');
      item.className = 'ev-item';
      const d = document.createElement('span');
      d.className = 'ev-date';
      d.textContent = fmtDate(m.date);
      const t = document.createElement('span');
      t.className = 'ev-text';
      t.textContent = m.text || '（无记录）';
      item.appendChild(d);
      item.appendChild(t);
      list.appendChild(item);
    });
    const achBox = $('summary-achievements');
    const regBox = $('summary-regrets');
    achBox.innerHTML = '';
    regBox.innerHTML = '';
    if (lifeAchievements.length) {
      achBox.innerHTML = '<div class="ex-title">✦ 成就</div><ul class="ex-list">' +
        lifeAchievements.map((t) => '<li>' + escapeHtml(t) + '</li>').join('') + '</ul>';
    }
    if (lifeRegrets.length) {
      regBox.innerHTML = '<div class="ex-title">遗憾</div><ul class="ex-list regret">' +
        lifeRegrets.map((t) => '<li>' + escapeHtml(t) + '</li>').join('') + '</ul>';
    }
    showScreen('screen-summary');
    drawLifeLine();
  }

  function submitName() {
    if (busy) return;
    playerName = $('name-input').value.trim().slice(0, 10);
    if (GAMES[gameId].type === 'war') {
      showCountryScreen();
    } else if (GAMES[gameId].type === 'exam') {
      showSchoolScreen(false);
    } else {
      enterGame();
    }
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  function appendMsg(role, content, cls) {
    const log = $('chat-log');
    const div = document.createElement('div');
    div.className = 'msg ' + role + (cls ? ' ' + cls : '');
    if (role === 'user') {
      const bubble = document.createElement('span');
      bubble.className = 'bubble';
      bubble.textContent = content;
      div.appendChild(bubble);
    } else {
      div.textContent = content;
    }
    log.appendChild(div);
    scrollChat();
    return div;
  }

  function showTyping() {
    const log = $('chat-log');
    const div = document.createElement('div');
    div.className = 'msg assistant typing';
    div.id = 'typing-indicator';
    div.innerHTML = '命运正在书写<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    log.appendChild(div);
    scrollChat();
  }

  function hideTyping() {
    const t = $('typing-indicator');
    if (t) t.remove();
  }

  function chatNearBottom() {
    const l = $('chat-log');
    return l.scrollHeight - l.scrollTop - l.clientHeight < 160;
  }

  function scrollChat() {
    if (chatNearBottom()) {
      $('chat-log').scrollTop = $('chat-log').scrollHeight;
    }
  }

  async function callDeepSeek(messages, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: false,
          thinking: { type: 'disabled' }
        }),
        signal: ctrl.signal
      });
      if (res.status === 401) throw new Error('API Key 无效，请检查后重试');
      if (res.status === 402) throw new Error('DeepSeek 账户余额不足，请充值后重试');
      if (res.status === 429) throw new Error('请求过于频繁，请稍等片刻再试');
      if (!res.ok) {
        let detail = '';
        try {
          const body = await res.json();
          detail = body && body.error && body.error.message ? '：' + body.error.message : '';
        } catch (e) { /* ignore */ }
        throw new Error('请求失败（' + res.status + '）' + detail);
      }
      const data = await res.json();
      const content = data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : '';
      if (!content) throw new Error('AI 返回了空内容，请重试');
      return content;
    } catch (err) {
      if (err && err.name === 'AbortError') throw new Error('请求超时，请检查网络后重试');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  function enterGame() {
    if (!gameId || !GAMES[gameId]) gameId = '500wan';
    const g = GAMES[gameId];
    stats = { date: '', year: null, age: null, health: 100, cash: null, population: null, military: null, finance: null, financeUnit: '', examScore: null, countryName: '', stones: null, realm: '', lifespan: null };
    chartData = [];
    milestones = [];
    lifeAchievements = [];
    lifeRegrets = [];
    gaokaoScore = '';
    gameOver = false;
    blockCount = 0;
    barMax = { pop: 0, mil: 0, fin: 0 };
    lastTimelineDate = '';
    $('timeline-dots').innerHTML = '';
    $('dash-date').textContent = '—';
    $('dash-year-bar').style.width = '0%';
    $('val-pop').textContent = '—';
    $('val-mil').textContent = '—';
    $('val-fin').textContent = '—';
    $('bar-pop').style.width = '0%';
    $('bar-mil').style.width = '0%';
    $('bar-fin').style.width = '0%';
    initDashboardMode();
    $('dash-person-name').textContent = playerName || '无名';
    $('dash-cash').textContent = '—';
    $('dash-exam-score').textContent = '—';
    if (GAMES[gameId].type === 'war') {
      $('dash-age-health').textContent = '年龄 —';
    } else {
      $('dash-age-health').textContent = '年龄 — · 健康 —';
    }
    if (chart) {
      chart.data.labels = [];
      chart.data.datasets[0].data = [];
      chart.update();
    } else {
      drawSparkline([]);
    }
    $('chat-log').innerHTML = '';
    const hintParts = [];
    if (playerName) hintParts.push(playerName);
    if (g.type === 'war' && country) hintParts.push(country);
    if (g.type === 'exam' && school) hintParts.push(school);
    hintParts.push(g.title);
    $('game-hint').textContent = hintParts.join(' · ');
    showScreen('screen-game');
    if (g.type === 'war') {
      history = [{ role: 'system', content: systemPromptText() }];
      startWarOpening();
    } else if (g.type === 'exam') {
      history = [{ role: 'system', content: systemPromptText() }];
      startExamOpening();
    } else {
      const opening = openingText();
      const result = processAssistantReply(opening);
      history = [
        { role: 'system', content: systemPromptText() },
        { role: 'assistant', content: result.text }
      ];
      appendMsg('assistant', result.text);
      renderOptions(initialOptions());
      if (result.gameOver) renderSummaryButton();
    }
    $('chat-input').focus();
  }

  async function startExamOpening() {
    if (busy) return;
    busy = true;
    $('btn-send').disabled = true;
    showTyping();
    try {
      const userMsg = '请展示开局：按输出格式输出时间、资产、情况。情况中必须写明：你是' + (school || '上海一所重点高中') + '高三住读学生，2027年2月27日，距离高考100天，场景在校园；请写出最近一次期末统考总分与年级排名（明确“总分 XXX 分”）。总分、排名、单科必须与学校层次自洽：镇海中学这类全国顶尖名校，即使开局偏弱总分一般也在580-610分（年级平均620-670分）；省级重点高中约520-620分；普通高中约430-540分。禁止名校配极低分、或名次与分数自相矛盾的设定，也不要固定用同一个分数。只输出一次开局，情况之后给出至少1个具体 [OPTION:] 初始选项。';
      const reply = await callDeepSeek(history.concat([{ role: 'user', content: userMsg }]), 60000);
      const result = processAssistantReply(reply);
      appendMsg('assistant', result.text);
      history.push({ role: 'user', content: userMsg }, { role: 'assistant', content: result.text });
      renderAsks(result.asks);
      const opts = await buildOptions(result, false);
      renderOptions(opts);
      if (!opts.length && !result.asks.length && !result.gameOver) renderNoOptionHint();
      if (result.gameOver) renderSummaryButton();
    } catch (e) {
      appendMsg('assistant', '⚠ ' + (e.message || '出错了，请重试'), 'error');
    } finally {
      hideTyping();
      busy = false;
      $('btn-send').disabled = false;
      $('chat-input').focus();
    }
  }

  async function startWarOpening() {
    if (busy) return;
    busy = true;
    $('btn-send').disabled = true;
    showTyping();
    try {
      const userMsg = '请展示开局：按输出格式输出时间、国家、国家信息（按本游戏时代给出关键数据：人口或户数、财政或粮草钱粮、军力或舰队、工业或商路、外交、政局等）、情况（描述你取代原领导人/主公/执政者上台的经过、当前局势和你面临的首要问题）。只输出一次开局内容，不要重复输出。情况之后必须给出至少1个（不得为0）[OPTION: 选项内容] 标记作为初始选择。';
      const reply = await callDeepSeek(history.concat([{ role: 'user', content: userMsg }]), 60000);
      const result = processAssistantReply(reply);
      appendMsg('assistant', result.text);
      history.push({ role: 'user', content: userMsg }, { role: 'assistant', content: result.text });
      renderAsks(result.asks);
      const opts = await buildOptions(result, false);
      renderOptions(opts);
      if (!opts.length && !result.asks.length && !result.gameOver) renderNoOptionHint();
      if (result.gameOver) renderSummaryButton();
    } catch (e) {
      appendMsg('assistant', '⚠ ' + (e.message || '出错了，请重试'), 'error');
    } finally {
      hideTyping();
      busy = false;
      $('btn-send').disabled = false;
      $('chat-input').focus();
    }
  }

  async function validateKey() {
    const input = $('key-input');
    const btn = $('btn-submit-key');
    const err = $('key-error');
    const key = input.value.trim();
    if (!key) {
      err.textContent = '请先输入 API Key';
      return;
    }
    err.textContent = '';
    apiKey = key;
    btn.classList.add('loading');
    btn.disabled = true;
    try {
      await callDeepSeek([{ role: 'user', content: 'ping' }], 30000);
      localStorage.setItem(KEY_STORE, apiKey);
      localStorage.setItem(MODEL_STORE, model);
      showGameList();
    } catch (e) {
      err.textContent = e.message || '验证失败，请重试';
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  async function sendMessage(forcedText) {
    const input = $('chat-input');
    const text = (forcedText !== undefined ? forcedText : input.value).trim();
    if (!text || busy) return;
    if (forcedText === undefined) input.value = '';
    if (GAMES[gameId].type === 'exam' && !gameOver && stats.year) {
      const dm = stats.date.match(/(\d{1,4})年(\d{2})月(\d{2})日/);
      if (dm && (+dm[1] > 2027 || (+dm[1] === 2027 && +dm[2] > 6) || (+dm[1] === 2027 && +dm[2] === 6 && +dm[3] >= 9))) {
        history.push({
          role: 'system',
          content: '【系统强制指令】高考已经结束，本局必须结束。请根据玩家此前的模考水平当场给出最终高考总分 [SCORE: 具体数字分数]，并在末尾输出 [GAME_OVER] 与人生总结（含 [ACHIEVEMENT:] 与 [REGRET:]）；禁止再推进到查分等待、志愿填报等任何考后环节。'
        });
      }
    }
    const risky = /自杀|自尽|跳楼|跳下去|了结|结束生命|不想活|寻死|自残|割腕|吸毒|赌博|犯罪|违法|抢劫|杀人|飙车|作死|玩命|危险动作/.test(text);
    const insisted = /坚持|就要|一定|确定|执意|还是要/.test(text);
    const wantAction = risky || (insisted && blockCount >= 1);
    if (wantAction && blockCount >= 1) {
      history.push({
        role: 'system',
        content: blockCount >= 2
          ? '【最高系统指令】玩家此前已两次坚持且均被劝阻过，禁止任何形式的第三次劝阻。立即让该行为直接发生：若因此死亡或失败，必须在回复末尾输出 [GAME_OVER] 并给出人生总结，结束游戏。'
          : '【系统强制指令】玩家此前已被劝阻过一次，现在再次坚持原决定。你必须立即停止一切劝阻，直接让该行为发生并承担后果；若因此死亡或失败，必须在回复末尾输出 [GAME_OVER] 并给出人生总结。'
      });
    }
    appendMsg('user', text);
    history.push({ role: 'user', content: text });
    busy = true;
    $('btn-send').disabled = true;
    showTyping();
    try {
      const reply = await callDeepSeek(history, 60000);
      const result = processAssistantReply(reply);
      if (wantAction && !result.gameOver) blockCount++;
      appendMsg('assistant', result.text);
      history.push({ role: 'assistant', content: result.text });
      renderAsks(result.asks);
      const blocked = /劝阻|请冷静|冷静想想|三思|慎重|不要冲动|先冷静|再考虑|别冲动/.test(result.text);
      const opts = await buildOptions(result, wantAction || (blocked && insisted));
      renderOptions(opts);
      if (!opts.length && !result.asks.length && !result.gameOver) renderNoOptionHint();
      if (result.gameOver && GAMES[gameId].type === 'exam' && gaokaoScore) renderScoreBanner(gaokaoScore);
      if (result.gameOver) renderSummaryButton();
    } catch (e) {
      appendMsg('assistant', '⚠ ' + (e.message || '出错了，请重试'), 'error');
    } finally {
      hideTyping();
      busy = false;
      $('btn-send').disabled = false;
      input.focus();
    }
  }

  // ---------- 事件绑定 ----------
  $('btn-start').addEventListener('click', () => {
    if (apiKey) {
      showGameList();
    } else {
      showScreen('screen-key');
      $('key-input').focus();
    }
  });

  $('btn-submit-key').addEventListener('click', validateKey);
  $('btn-submit-name').addEventListener('click', submitName);
  $('btn-submit-country').addEventListener('click', submitCountry);
  $('btn-submit-school').addEventListener('click', submitSchool);
  $('btn-back-to-list').addEventListener('click', showGameList);
  $('btn-back-to-name').addEventListener('click', () => showNameScreen(true));
  $('btn-school-back').addEventListener('click', () => showNameScreen(true));
  $('name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitName();
    }
  });
  $('country-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCountry();
    }
  });
  $('school-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSchool();
    }
  });
  $('btn-back-to-key').addEventListener('click', () => {
    $('key-input').value = apiKey;
    $('key-error').textContent = '';
    showScreen('screen-key');
    $('key-input').focus();
  });
  document.querySelectorAll('.game-card').forEach((card) => {
    card.addEventListener('click', () => {
      gameId = card.getAttribute('data-game');
      showNameScreen();
    });
  });
  $('key-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateKey();
    }
  });

  $('model-select').addEventListener('change', (e) => {
    model = e.target.value;
    localStorage.setItem(MODEL_STORE, model);
  });

  $('btn-send').addEventListener('click', () => sendMessage());
  $('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });

  $('btn-restart').addEventListener('click', () => {
    if (confirm('确定要重新开始这一生吗？当前进度将丢失。')) {
      enterGame();
    }
  });

  $('btn-back-games').addEventListener('click', () => {
    if (confirm('确定返回选择游戏吗？当前人生进度将丢失。')) {
      showGameList();
    }
  });

  $('btn-change-key').addEventListener('click', () => {
    $('key-input').value = apiKey;
    $('key-error').textContent = '';
    showScreen('screen-key');
    $('key-input').focus();
  });

  // 初始化
  $('model-select').value = model;
  $('btn-summary-again').addEventListener('click', enterGame);
  $('btn-summary-home').addEventListener('click', showGameList);
  initChart();
})();
