class ExpressError extends Error{
    constructor(StatusCode , msg){
        super();
        this.msg=msg;
        this.StatusCode=StatusCode;
    }
}

module.exports = ExpressError;
