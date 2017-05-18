module.exports = {
	IP: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
	PORT: process.env.OPENSHIFT_NODEJS_PORT || 9292
};
