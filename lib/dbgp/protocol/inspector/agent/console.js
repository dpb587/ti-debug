function Console() {
}

/* ************************************************************************** */

Console.prototype.enable = function (params, callback) {
    callback();
};

Console.prototype.clearMessages = function (params, callback) {
    callback();
};

/* ************************************************************************** */

module.exports = Console;
