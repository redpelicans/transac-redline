REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER)

test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER) --watch

lint:
	./node_modules/.bin/jshint ./lib ./lib-phantom ./test ./index.js

lib-cov:
	./node_modules/.bin/jscoverage --no-highlight transac.js

clean:
	rm -f transac-cov.js

test-cov: lib-cov
	@COVERAGE=1 $(MAKE) test REPORTER=html-cov > coverage.html
	$(MAKE) clean

test-coveralls: 
	@NODE_ENV=test ./node_modules/.bin/istanbul cover  ./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js --verbose

.PHONY: test test-w
