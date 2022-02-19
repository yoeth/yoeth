export default function ping({session}) {
    if (session.alt_message === "天王盖地虎") {
        session.send({message:"宝塔镇河妖"});
    }
}