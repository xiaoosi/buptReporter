import got, { Got } from "got";
import { CookieJar } from "tough-cookie";
import { LoginForm, DailyReportForm, DailyReportResponse } from "./form";
import { sleep, randomBetween } from "./utils";
import Sender from "./Sender"

const PREFIX_URL = "https://app.bupt.edu.cn";
const LOGIN = "uc/wap/login/check";
const GET_REPORT = "ncov/wap/default/index";
const POST_REPORT = "ncov/wap/default/save";
const RETRY = 5000;
const TIMEOUT = 10000;

class Reporter {
    user: LoginForm
    cookieJar: CookieJar
    client: Got
    sender: Sender
    constructor(user: LoginForm, senderurl: string) {
        this.user = user
        this.cookieJar = new CookieJar();
        this.client = got.extend({
            prefixUrl: PREFIX_URL,
            cookieJar: this.cookieJar,
            retry: RETRY,
            timeout: TIMEOUT,
        });
        this.sender = new Sender(senderurl)
    }


    async login() {
        const response = await this.client.post(LOGIN, { form: this.user });
        if (response.statusCode != 200) {
            throw new Error(`login 请求返回了 ${response.statusCode}`);
        }
    }

    async getDailyReportFormData(): Promise<DailyReportForm> {
        const response = await this.client.get(GET_REPORT);
        if (response.statusCode != 200) {
            throw new Error(`getFormData 请求返回了 ${response.statusCode}`);
        }
        if (response.body.indexOf("登录") != -1) {
            throw new Error("登录失败；请检查用户名与密码是否正确");
        }
        const newForm: DailyReportForm = JSON.parse(
            /var def = (\{.+\});/.exec(response.body)?.[1] ?? ""
        );
        const oldForm: DailyReportForm = JSON.parse(
            /oldInfo: (\{.+\}),/.exec(response.body)?.[1] ?? ""
        );

        if (oldForm.geo_api_info === undefined) {
            throw new Error("昨天的信息不完整；请手动填报一天后继续使用本脚本");
        }

        const geo = JSON.parse(oldForm.geo_api_info);

        // 前一天的地址
        const province = geo.addressComponent.province;
        let city = geo.addressComponent.city;
        if (geo.addressComponent.city.trim() === "" && ["北京市", "上海市", "重庆市", "天津市"].indexOf(province) > -1) {
            city = geo.addressComponent.province;
        } else {
            city = geo.addressComponent.city;
        }
        const area = geo.addressComponent.province + " "
            + geo.addressComponent.city + " "
            + geo.addressComponent.district;
        const address = geo.formattedAddress;

        Object.assign(oldForm, newForm);
        // @ts-ignore
        delete oldForm.jrdqtlqk;
        // @ts-ignore
        delete oldForm.jrdqjcqk;



        // 覆盖昨天的地址
        oldForm.province = province;
        oldForm.city = city;
        oldForm.area = area;
        oldForm.address = address;

        // 强制覆盖一些字段
        // 是否移动了位置？否
        oldForm.ismoved = "0";
        // 不在同城原因？空
        oldForm.bztcyy = "";
        // 是否省份不合？否
        oldForm.sfsfbh = "0";
        return oldForm;
    }
    async postDailyReportFormData(formData: DailyReportForm): Promise<DailyReportResponse> {
        const response = await this.client.post(POST_REPORT, { form: formData });
        if (response.statusCode != 200) {
            throw new Error(`postFormData 请求返回了 ${response.statusCode}`);
        }
        return JSON.parse(response.body);
    }
    async report(): Promise<boolean> {
        try {
            this.sender.log("用户登录中");
            await this.login();
            await sleep(randomBetween(1000, 2000));
            this.sender.log("正在获取前一天的疫情填报信息");
            const formData = await this.getDailyReportFormData();
            this.sender.log("填报表单：\n```json\n" + JSON.stringify(formData, null, 4) + "\n```")
            await sleep(randomBetween(1000, 2000));
            this.sender.log("正在提交今日疫情填报信息");
            const reportReponse = await this.postDailyReportFormData(formData);
            this.sender.log(`今日填报结果：${reportReponse.m}`);
            this.sender.setTitle(`今日填报结果：${reportReponse.m}`)
            this.sender.sendLog()
            return true
        } catch (e) {
            if (e instanceof Error) {
                this.sender.setTitle(`填报失败：\`${e.message}\``)
                this.sender.log(e.message)
            } else {
                this.sender.log(e)
            }
            this.sender.sendLog()
            return false
        }
    }
    async run() {
        while (1) {
            let res = await this.report()
            if (res) {
                return
            }
            await sleep(5 * 60 * 1000)
        }


    }

}
export default Reporter