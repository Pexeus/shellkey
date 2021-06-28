#!/usr/bin/env node

const readline = require("readline");
const os = require('os')
const fs = require('fs')
const cp = require('child_process')
const {NodeSSH} = require('node-ssh')

async function init() {
    const args = process.argv
    const host = args[2]
    const userInfo = os.userInfo()
    const keyPath = `${userInfo.homedir}\\.ssh\\`

    if (!process.platform.includes("win")) {
        console.log("> Only working on Windows for now");
        return;
    }

    if (args.length != 3) {
        console.log("> Usage: shellkey <user@host>");
        return;
    }

    if (!verifyHost(host)) {
        console.log("> Usage: shellkey <user@host>");
        return;
    }

    if (!checkKeys(keyPath)) {
        console.log("> No keys found, generating keys...");
        await keyGen(keyPath)
    }

    const transmitted = await transmitKey(host, keyPath)
    console.log(transmitted);
}

function keyDir(ssh) {
    return new Promise(async (resolve, reject) => {
        const homeContents = await ssh.execCommand("ls -a").then(result => {
            if (result.stderr != "") {
                console.log(result.stderr);
                return false
            }

            return result.stdout
        })

        const homeDir = await ssh.execCommand("pwd").then(result => {
            if (result.stderr != "") {
                console.log(result.stderr);
                return false
            }

            return result.stdout
        })

        const keyPath = `${homeDir}/.ssh/`

        if (homeContents.includes(".ssh")) {
            console.log("> Remote key directory located");

            const keyDirContents = await ssh.execCommand("ls -a", {cwd: keyPath}).then(result => {
                if (result.stderr != "") {
                    console.log(result.stderr);
                    return false
                }
    
                return result.stdout
            })

            if (!keyDirContents.includes("authorized_keys")) {
                await createAuthFile(ssh, keyPath)
            }

            resolve(keyPath)
        }
        else {
            await createKeyDir(ssh)
            await createAuthFile(ssh, keyPath)

            resolve(keyPath)
        }
    })
}

function createAuthFile(ssh, dir) {
    console.log("> Creatig remote auth file...");

    return new Promise(async resolve => {
        const fileCreated = await ssh.execCommand("touch authorized_keys", {cwd: dir}).then(result => {
            if (result.stderr != "") {
                console.log(result.stderr);
                return false
            }

            return true
        })

        console.log(fileCreated);
        if (fileCreated) {
            resolve()
        }
    })
}

function createKeyDir(ssh) {
    console.log("> Creating remote key directory...");

    return new Promise(async resolve => {
        const dirCreated = await ssh.execCommand("mkdir -m 700 ~/.ssh", {}).then(result => {
            if (result.stderr != "") {
                console.log(result.stderr);
                return false
            }

            return true
        })

        if (dirCreated) {
            resolve()
        }
    })
}

async function transmitKey(host, keyPath) {
    return new Promise(async (resolve, reject) => {
        const user = host.split("@")[0]
        const address = host.split("@")[1]
        const publicKey = fs.readFileSync(keyPath + "/id_rsa.pub", "utf-8")

        const ssh = await sshConnect(address, user)
        const remoteKey = await keyDir(ssh) + "/authorized_keys"

        const keyTransmitted = await ssh.execCommand(`echo "${publicKey}" >> ${remoteKey}`).then(result => {
            if (result.stderr != "") {
                console.log(result.stderr);
                console.log("> Failed to Write to file");
                return false
            }
            
            return true
        })

        if (keyTransmitted) {
            console.log(`> Key successfully transmitted to ${address}`);
            resolve(true)
        }
        else {
            resolve(false)
        }
    })
}

async function sshConnect(address, user) {
    const debug = false
    const ssh = new NodeSSH()
    let password
    
    if (debug) {
        password = "sml12345"
    }
    else {
        password = await askSecret("Password")
    }

    return new Promise((resolve, reject) => {
        ssh.connect({
            host: address,
            username: user,
            password: password
        })
        .then(() => {
            console.log(`Connection established with ${address}`);
            resolve(ssh)
        }, err => {
            console.log(String(err));
            resolve(false)
        })
    })
}

function keyGen(keyPath) {
    return new Promise((resolve, reject) => {
        const keygen = cp.spawn("ssh-keygen", [
            '-t','rsa',
            '-b', "2048",
            '-C', "",
            '-N', "",
            '-f', keyPath + "/id_rsa",
        ])
    
        keygen.stdout.on("data", data => {
            console.log(String(data));
        })
    
        keygen.stderr.on("data", data => {
            console.log(String(data));
            resolve(false)
        })
    
        keygen.on("close", () => {
            console.log("> Keys generated!");
            resolve(true)
        })
    })
}

function checkKeys(keyPath) {
    const contents = fs.readdirSync("C:\\Users\\Liam\\.ssh\\")
    
    if (contents.includes("id_rsa.pub") && contents.includes("id_rsa")) {
        return true
    }

    return false
}

function askSecret(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });    

    rl.input.on("keypress", function (c, k) {
        var len = rl.line.length;
        readline.moveCursor(rl.output, -len, 0);
        readline.clearLine(rl.output, 1);
        
        for (var i = 0; i < len; i++) {
            rl.output.write("*");
        }
    });

    return new Promise((resolve) => {
        rl.question(`> ${question}: `, answer => {
            rl.close();
            resolve(answer)
        })
    })
}

function ask(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`> ${question}: `, answer => {
            rl.close();
            resolve(answer)
        })
    })
}

function verifyHost(host) {
    if (host != undefined && host.includes("@")) {
        return true;
    }

    return false;
}

init()