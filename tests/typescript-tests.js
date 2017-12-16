const path = require('path');
const exec = require('child_process').exec;
const should = require('should');

describe('typescript declaration file', () => {
	it('should successfully compile typescript without errors', (done) => {
		const sourceFile = path.join(__dirname, 'test.ts');
		const tsc = path.resolve(path.join(__dirname, '..', 'node_modules', '.bin', 'tsc'));
		const cmd = `"${tsc}" --noEmit ${sourceFile}`;

		exec(cmd, (err, stdout, stderr) => {
			stdout.should.equal('');
			stderr.should.equal('');
			should(err).equal(null);
			done();
		});
	});
});
