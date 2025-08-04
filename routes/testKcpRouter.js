const shell = require("shelljs");
const dayjs = require("dayjs");
const path = require("path");
const express = require("express");
const os = require("os");

const COMMAND = {
    "MAKE_HASH_WITH_SEED" : "lf_CT_CLI__make_hash_data"
}

const isWindow = os.platform() === "win32";
const PATH_CT_CLI_X64 = isWindow
  ? path.join(__dirname, "..", "newKcpBin", "ct_cli_exe.exe")
  : path.join(__dirname, "..", "newKcpBin", "ct_cli_x64");
const router = express.Router();
const axios = require("axios")

router.get("/", (req, res) => {
  res.send("여기는 kcp 테스트 라우터! os 버전은 " + os.platform());
});

/**
 * lf_CT_CLI__make_hash_data 명령어 활용해 기본시드로 암호문만들기(현재 pc의 시간이 시드로 들어간다)
 */
router.get("/kcpcertMakeHash", (req, res) => {
  const ordr_idxx = dayjs().format("YYMMDDHHmmss") + dayjs().millisecond().toString().padStart(2, "0").slice(0, 2); // YYMMDDHHMMSSmm 밀리세컨까지 14자리
  const year = "00";
  const month = "00";
  const day = "00";
  const user_name = "";
  const sex_code = "";
  const local_code = "";

  // SM13924030800461164000000
  // SM139 24년 03월 08일 00시 46분 11초 64000000밀리세컨드
  const hash_data = "SM139" + ordr_idxx + user_name + year + month + day + sex_code + local_code;


  console.log("hash_data >> ", hash_data);

  const result = mf_exec(COMMAND.MAKE_HASH_WITH_SEED, hash_data);
  console.log("result >> ", result);

  res.json({
    realCommand: "./ct_cli_exe.exe lf_CT_CLI__make_hash_data SM13924030801480486000000",
    msg: "hashString => 해싱시드만드는 규칙, hash_data => 그거로나온 해싱시드(ex SM13924030800461164000000), result => 해싱시드를 암호화모듈에 던져서 나온 값(ex F2ED622CFA273504E5D743098063DAC89227782A)",
    hashString: `const hash_data = SITE_CD + ordr_idxx + user_name + year + month + day + sex_code + local_code;`,
    hash_data,
    result,
  });
});

router.get("/kcpcertRidirect", (req, res) => {
  res.json({
    msg: "kcpcertRidirect 겟으로 오면안됨, kcp는 post로 쏴주기때문",
  });
});

/**
 * kcp에 넘길때 redirectUrl을 지정하는데
 * kcp에서 인증처리후 필요한 자료들을 여기 라우터로 redirect해준다
 * http://{host}/kcpcertRidirect?dummy=Y 하면 더미로 테스트
 */
router.post("/kcpcertRidirect", async (req, res) => {

  const isDummy = req.query.dummy === "Y";
  const encData = isDummy ? DUMMY : req.body;
  console.log("🚀 ~ router.post ~ encData:", encData);

  const decodeOptionss = [
    "lf_CT_CLI__decrypt_enc_cert",
    encData.site_cd, // "SM139",
    encData.cert_no, // "23322164975118",
    encData.enc_cert_data, //  "2537A1C7F7937AC3DD5F... 겁나김 암호문 풀어야댐..
    // "1", // 고정 - 뺴야되네갑자기;
  ];

  // 예시 복호 커맨드 ./ct_cli_exe.exe lf_CT_CLI__decrypt_enc_cert SM139 23648019074310 FA0DABF6C7EC5D5917600036E469634B98E796BD5231AE76D98F2B651D96842A3EF76DE78B92FCC663AAEDF49F8EFC3CF33C86E23B30650F7F4CF67D16518CB906CF8767D9E65C13FE929BC72832591E74F1B41D13E028BABA3EC1208F7361FD6940298586E229E38B370DE74FAEC7466D493155DC4FC4DA7FF94431E6763E0EE87C60853AC5A11BBD2326F9AFA4D3E462D2E001F02154BE56BC4933C8FF66423CF34D5CE51A01F1A64758338C397CF1E3A990C0C5D966B20DE29CFD39BE9CD99FD97F9F8F3D10A1D0DE8BBC9318597EAA1AC13C6BF50E7F20FC9C9B6F1B43C278E4C7D7AD11C0BE16D91C72F373D31D3F556EBD529944DB1AEA8E44D84BB6A3C3ED53A6F293E1D149A54E4B967BBB49B8E5B64514EBFB22765CCD904B6993F29C7256CAB159A74D7D7817C868AD774BC52B6D8F9E20EC0D8ADC73F05AF58FF642E5A70AA6714550D74C9E683A468D5CE010BC945A770DCBFBC55039B968A1C614D3EF552FDB82BB52F95D34051F53995FC4A713CFE7676ED165766A256E952112638D6CB6A5238E41B7A530E375BFE94FF01F2E76254662FA320502481F63EFEB3D7D88D5A1731B112850287413768C91BFD7FF63E998C3E1AEFDA01B69F9A426220EE17D3571FAEFB2B55E54CF879D7577B5B71FC1035CC4548DD9BD5C97ACAF15E3F282FDF27EF39904C0B814C5C3
  const cmds = decodeOptionss.join(" ")
  const result = mf_exec(cmds)
  if(!result){
    res.send({err: "mf_exec 리턴이없음"})
    return
  }
//   console.log("🚀 ~ router.post ~ re:", re);

  /** result 생긴모양 대충
   * web_siteid_hashYN=web_site
   * id=phone
   * _no=01026444093
   * user_name=송종현
   * birth_day=19940624
   * sex_code=01
   * local_code=01c      
   * 
   * comm_id=LGM
   * ci=jbBFLWoQdblJDiknoZ73owj2+WLhwDDt8De1fEzArSzPuzmP38Yn053bOttITyks0iVuMb6/hixxkUpvEmVbdQ==
   * di=MC0GCCqGS SIb3DQIJAyEA2RNHwrh6P2woPRKSS6qqD1LDuLCQ0XMMVYETN4KJhi0=
   * ci_url=jbBFLWoQdblJDiknoZ73owj2%2BWLhwDDt8De1fEzArSzPuzmP388Yn053bOttITyks0iVuMb6%2FhixxkUpvEmVbdQ%3D%3D
   * di_url=MC0GCCqGSIb3DQIJAyEA2RNHwrh6P2woPRKSS6qqD1LDuLCQ0XMMVYETN4KJhi00%3D
   * res_cd=0000
   * res_msg=정상처리
   */

  // 데이터 자체가 a=1b=2 이런식으로 보이지만 a=1{31코드}b=2 이러케되어잇는듯    
  let listData = result.split(String.fromCharCode(31));
  listData = listData.map((data) => data.split("="));
  listData = Object.fromEntries(listData);

  res.json({
    msg: "kcpcertRidirect 리디렉트함보자",
    kcpRedirectData: encData,
    decodeKcpRedirectData : listData
  });
});

module.exports = router;

function mf_exec(...params) {
  const cmdString = PATH_CT_CLI_X64 + " " + params.join(" ");
  console.log("cmdString >> ", cmdString);

  const shellResult = shell.exec(cmdString);

  if (shellResult.code !== 0) {
    console.error("Error executing command:", shellResult.stderr);
    throw new Error(`Command failed with code ${shellResult.code}: ${shellResult.stderr}`);
  }


  const resultStdout = shellResult.stdout;
  
  console.log("resultStdout >> ", resultStdout);

  return resultStdout;
}

// kcp에서 리다이렉트 되어서 우리서버 POST로 올떄 body안에있는데이터들
const DUMMY = {
    phone_no: '',
    res_msg: '%C1%A4%BB%F3%C3%B3%B8%AE',
    DI: '',
    year: '0',
    user_name_url_yn: '',
    cert_otp_use: 'Y',
    CI_ENC_YN: 'Y',
    comm_id: 'LGM',
    sex_code: '',
    safe_guard_yn: 'N',
    PRE_USE_YN: 'N',
    van_tx_id: '24030808013115515',
    tx_type: '2600',
    day: '0',
    site_key: '',
    enc_cert_data: 'C570BA479DC9F3D25379968C270AEE27760B2E82AC3A70AA76E5EFF4CD8957DC931209AC0052EE2CE872A2D22D7E884A325B2680E6BCE56094ED551DFD5AD0606691CAB8558E99E6D8AB262264F3E24E728BFCC7559A64FE1D6170EBF73B2B5C027D969B92AB42495AA8A6E9215178C17124F5796A644F115F31C74D63FDD4D3F1E8FB647153EA0F882069B07C88223BBB78A3D17A29D4EB9D846A2904D86E467BED24D11773A4CF9B92453D4E12561CA31DB0C6978304EDE17B35B214E6B99F8BADDD543EE1E4AE9BAC84A24728ADAA65CEA354810CD25495E81D22041383D32851ECFF1C98C9F2915C8A6440F03D9E7A89317E65C3C7D0AB4AC872EE700B6020A0DAA301BF4E059C8048E07DFA5E31892E3629D9666BC83EA073B461F961C1A773A815EB7B01C8D3BEF84153A43CCD62C4BB019E80F370DF4A895B3D57182F528700BF3741BDF77F1CE4EBAF07D75065411035872C269D930CEF38AFFADBA52879EE0AD3BABD54F810863391B7870286264A97EB5BCC240D41B234CAD3A688833D4FE2A5B4F8768A4C98F6B73B2F3698333D779A380FE1F720CBEC73520FFD652C9CE94D60787FA43BA0E2813F70983FDAB013A57796234B8EFF0888E7F825F5DE2D5C7C07805E899D89D3B175DCFE8BF54FD3153EB42EFF937651BF878EC59A1AE4801DED2095C91CBFEF029BABB2',
    web_siteid_hashYN: '',
    dn_hash: 'undefined',
    res_cd: '0000',
    DI_URL: '',
    month: '0',
    Ret_URL: 'http://localhost:19000/kcp/kcpcertRidirect',
    van_sms_yn: '',
    auth_tx_id: '',
    kcp_merchant_time: '',
    info_code: '',
    user_name: '%BC%DB%C1%BE%C7%F6',
    cert_02_yn: 'Y',
    log_trace_no: 'SM139RS8EOLraYg5',
    param_opt_1: 'opt1',
    Ret_Noti: '',
    param_opt_3: 'opt3',
    param_opt_2: 'opt2',
    cert_enc_use: 'Y',
    Logo_URL: '',
    cert_enc_use_ext: 'N',
    cert_no: '24698104196811',
    CI: '',
    session_id: '',
    local_code: '',
    web_siteid: '',
    cert_01_yn: 'Y',
    birth_day: '',
    up_hash: '',
    site_cd: 'SM139',
    CI_URL: '',
    per_cert_no: '24698104196811',
    ordr_idxx: '1AA7A22CCC3C66D9EF7E82886CCBF7FB4CEF8A3F',
    cert_method: '',
    req_tx: 'otp_auth'
  }
