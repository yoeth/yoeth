function segment(...values) {
    return values;
}
(function (segment) {
    function _handle(type) {
        return (data = {}) => {
            const field = ["text", "user_id", "message_id", "title", "content"];
            for (const entry of field) {
                typeof data[entry] === "number" && (data[entry] = data[entry].toString());
            }
            return {
                "type": type,
                "data": data
            };
        };
    }
    function space() {
        return {
            "type": "text",
            "data": {
                "text": " "
            }
        }
    }
    segment.text = _handle("text");
    segment.mention = _handle("mention");
    segment.mention_all = _handle("mention_all");
    segment.image = _handle("image");
    segment.voice = _handle("voice");
    segment.audio = _handle("audio");
    segment.video = _handle("video");
    segment.file = _handle("file");
    segment.location = _handle("location");
    segment.reply = _handle("reply");
    segment.space = space;
})(segment || (segment = {}));
export default segment;