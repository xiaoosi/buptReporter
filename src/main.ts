import Reporter from "./Reporter"
import fs from "fs"
import path from "path"
(async _ => {
    const userLines = fs.readFileSync(path.join(__dirname, "..", "user.txt")).toString().split("\n")
    for (let userLine of userLines) {
        let [username, password, senderurl] = userLine.split(' ')
        const reporter = new Reporter({ username, password }, senderurl)
        reporter.run()
    }
})();