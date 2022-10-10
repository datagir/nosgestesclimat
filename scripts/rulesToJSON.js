/*
	Aggregates the model to an unique JSON file for each targeted language.

	Command: yarn compile:rules -- [options]
*/

const yaml = require('yaml')
const fs = require('fs')
const glob = require('glob')
const yargs = require('yargs')
const path = require('path')
const R = require('ramda')
const { exit } = require('process')
const Engine = require('publicodes').default

const outputJSONPath = './public'
const outputJSONFileName = './public/co2.json'

// this file is kindof a duplicate of RulesProvider (which serves for the local
// watched webpack environment) in ecolab-climat if it grows more than 20
// lines, it should be shared

// TODO: to factorizes with all scripts
const availableLanguages = ['fr', 'en-us', 'es', 'it']
const defaultLang = availableLanguages[0]

const getArgs = (description) => {
	const argv = yargs
		.usage(`${description}\n\nUsage: node $0 [options]`)
		.option('force', {
			alias: 'f',
			type: 'boolean',
			description:
				'Force translation of all the keys. Its overwrites the existing translations.',
		})
		.option('source', {
			alias: 's',
			type: 'string',
			default: defaultLang,
			choices: availableLanguages,
			description: `The source language to translate from.`,
		})
		.option('file', {
			alias: 'p',
			type: 'string',
			description: `The source file to translate from inside the 'locales/pages' directory. If not specified, all the files in 'locales/pages' will be translated.`,
		})
		.option('remove', {
			alias: 'r',
			type: 'boolean',
			description: `Remove the unused keys from the translation files.`,
		})
		.option('markdown', {
			alias: 'm',
			type: 'boolean',
			description: `Prints the result in a Markdown table.`,
		})
		.option('target', {
			alias: 't',
			type: 'string',
			array: true,
			default: availableLanguages.filter((l) => l !== defaultLang),
			choices: availableLanguages,
			description: 'The target language(s) to translate to.',
		})
		.help()
		.alias('help', 'h').argv

	const srcLang = argv.source ?? defaultLang

	if (!availableLanguages.includes(srcLang)) {
		printErr(`ERROR: the language '${srcLang}' is not supported.`)
		process.exit(-1)
	}

	const destLangs = (argv.target ?? availableLanguages).filter((l) => {
		if (!availableLanguages.includes(l)) {
			printWarn(`SKIP: the language '${l}' is not supported.`)
			return false
		}
		return l !== srcLang
	})

	const srcFile = argv.file ?? 'data/**/*.yaml'

	return {
		srcLang,
		destLangs,
		force: argv.force,
		remove: argv.remove,
		srcFile,
		markdown: argv.markdown,
	}
}

const { destLangs, markdown } = getArgs(
	`Aggregates the model to an unique JSON file.`
)

const addTranslationToBaseRules = (baseRules, translatedRules) => {
	const updateBaseRules = (key, val) => {
		baseRules = R.assocPath(key, val, baseRules)
	}

	const updateBaseRulesWithSuggestions = (
		baseKey,
		baseRuleSuggestions,
		translatedSuggestionsKeys
	) => {
		const suggestionValues = Object.values(baseRuleSuggestions)
		const translatedSuggestions = Object.fromEntries(
			translatedSuggestionsKeys.map((translatedKey, i) => [
				translatedKey,
				suggestionValues[i],
			])
		)
		updateBaseRules(baseKey, translatedSuggestions)
	}

	Object.entries(translatedRules).forEach(([rule, attrs]) => {
		Object.entries(attrs)
			.filter(([attr, _]) => !attr.endsWith('.ref')) // TODO: extract to constant
			.forEach(([attr, transVal]) => {
				switch (attr) {
					case 'suggestions': {
						updateBaseRulesWithSuggestions(
							[rule, attr],
							baseRules[rule].suggestions,
							transVal
						)
						break
					}
					case 'mosaique': {
						updateBaseRulesWithSuggestions(
							[rule, attr, 'suggestions'],
							baseRules[rule].mosaique.suggestions,
							transVal.suggestions
						)
						break
					}
					default:
						updateBaseRules([rule, attr], transVal)
						break
				}
			})
	})

	return baseRules
}

const writeRules = (rules, path, destLang) => {
	fs.writeFile(path, JSON.stringify(rules), function (err) {
		if (err) {
			if (markdown) {
				console.log(
					`| Rules compilation to JSON for _${destLang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
				)
			} else {
				console.log(' ❌ An error occured while writting rules in:', path)
				console.log(err.message)
			}
			exit(-1)
		}
		console.log(
			markdown
				? `| Rules compilation to JSON for _${destLang}_ | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly written in JSON in: ${path}`
		)
	})
}

glob('data/**/*.yaml', { ignore: ['data/translated-*.yaml'] }, (_, files) => {
	const defaultDestPath = path.join(outputJSONPath, `co2-${defaultLang}.json`)
	const baseRules = files.reduce((acc, filename) => {
		try {
			const data = fs.readFileSync('./' + filename, 'utf8')
			const rules = yaml.parse(data)
			return { ...acc, ...rules }
		} catch (err) {
			console.log(
				' ❌ Une erreur est survenue lors de la lecture du fichier',
				filename,
				':\n\n',
				err.message
			)
			exit(-1)
		}
	}, {})

	try {
		new Engine(baseRules).evaluate('bilan')

		if (markdown) {
			console.log('| Task | Status | Message |')
			console.log('|:-----|:------:|:-------:|')
		}
		console.log(
			markdown
				? `| Rules evaluation | :heavy_check_mark: | Ø |`
				: ' ✅ Les règles ont été évaluées sans erreur !'
		)

		writeRules(baseRules, defaultDestPath, defaultLang)

		destLangs.forEach((destLang) => {
			const destPath = path.join(outputJSONPath, `co2-${destLang}.json`)
			const translatedRuleAttrs =
				yaml.parse(
					fs.readFileSync(`data/translated-rules-${destLang}.yaml`, 'utf8')
				) ?? {}
			const translatedRules = addTranslationToBaseRules(
				baseRules,
				translatedRuleAttrs
			)
			writeRules(translatedRules, destPath, destLang)
		})
	} catch (err) {
		if (markdown) {
			console.log(
				`| Rules evaluation | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
			console.log(err)
		} else {
			console.log(
				' ❌ Une erreur est survenue lors de la compilation des règles:\n'
			)
			let lines = err.message.split('\n')
			for (let i = 0; i < 9; ++i) {
				if (lines[i]) {
					console.log('  ', lines[i])
				}
			}
			console.log()
		}
	}
})
