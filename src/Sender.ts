import fetch from "node-fetch"
import FormData from "form-data"
class Sender {
    url: string
    tmpMessage: string
    tmpTitle: string
    constructor(url: string) {
        this.url = url
        this.tmpMessage = "";
        this.tmpTitle = "title"
    }
    async log(msg: string) {
        this.tmpMessage += msg + "\n\n\n";
    }
    async sendLog() {
        this.send(this.tmpTitle, this.tmpMessage);
        // console.log(this.tmpTitle, this.tmpMessage)
    }
    setTitle(title: string) {
        this.tmpTitle = title
    }
    async send(text = "默认标题", desp = "默认内容") {
        const form = new FormData();
        form.append("text", text);
        form.append("desp", desp);
        const res = await fetch(this.url, {
            method: "post",
            body: form,
            headers: form.getHeaders(),
        });
        return res.json();
    }
}
export default Sender