actionurldir=$(prefix)/libexec/hpeilo
actionurl_DATA=nagios_hpeilo_service_details.php hpeilo.parser.js hpeilo.style.css

EXTRA_DIST = $(actionurl_DATA)
install-data-hook:
	cp $(prefix)/libexec/nagios_hpeilo_engine  $(actionurldir)
