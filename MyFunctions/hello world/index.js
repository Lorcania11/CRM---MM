module.exports = async function (context, req) {
    context.log("✅ helloWorld function hit");
    context.res = { body: "It works!" };
};