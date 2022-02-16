export default function ping({session}) {
    if (session.alt_message === '天王盖地虎') {
        session.send_message('宝塔镇河妖');
    }
}