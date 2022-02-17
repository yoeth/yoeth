export default function ping({session}) {
    console.log(session.alt_message);
    if (session.alt_message === '天王盖地虎') {
        console.log("触发")
        session.send_message('宝塔镇河妖');
    }
}