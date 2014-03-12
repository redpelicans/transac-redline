REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER)

test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER) --watch

lint:
	./node_modules/.bin/jshint ./test ./index.js ./transac.js


clean:
	rm -f transac-cov.js

test-report:
	NODE_ENV=test ./node_modules/.bin/istanbul report

test-coveralls: 
	NODE_ENV=test ./node_modules/.bin/istanbul cover  ./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js --verbose


