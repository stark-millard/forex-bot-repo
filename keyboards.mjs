export const verifyKeyboard = JSON.stringify({
	inline_keyboard: [[{ text: 'Принимаю✅', callback_data: 'acceptVerify' }]]
})

export const profileKeyboard = JSON.stringify({
	inline_keyboard: [
		[{ text: '📈Инвестировать', callback_data: 'invest' }],
		[{ text: '💵Кошелёк', callback_data: 'wallet' }],
		[
			{ text: 'ℹ️Информация', callback_data: 'information' },
			{ text: '⚙️Верификация', url: 'https://t.me/ForexSupportUA' }
		],
		[{ text: '🔄Обновить', callback_data: 'refresh' }]
	]
})

export const deleteKeyboard = JSON.stringify({
	inline_keyboard: [[{ text: '❌Закрыть', callback_data: 'delete' }]]
})

export const doubleDeleteKeyboard = JSON.stringify({
	inline_keyboard: [[{ text: '❌Закрыть', callback_data: 'doubleDelete' }]]
})

export const walletKeyboard = JSON.stringify({
	inline_keyboard: [
		[
			{ text: '📥Пополнить', callback_data: 'donate' },
			{ text: '📤Вывести', callback_data: 'withdraw' }
		],
		[{ text: '❌Закрыть', callback_data: 'delete' }]
	]
})

export const investKeyboard = JSON.stringify({
	inline_keyboard: [
		[{ text: '❓FAQ', callback_data: 'investFaq' }],
		[
			{ text: '💵Криптовалюты', callback_data: 'investCrypto' },
			{ text: '💵Акции', callback_data: 'investStock' }
		],
		[{ text: '❌Закрыть', callback_data: 'delete' }]
	]
})

export const cryptoKeyboard = JSON.stringify({
	inline_keyboard: [
		[
			{ text: 'Bitcoin', callback_data: 'investBitcoin' },
			{ text: 'Ethereum', callback_data: 'investEthereum' }
		],
		[
			{ text: 'BNB', callback_data: 'investBNB' },
			{ text: 'Solana', callback_data: 'investSolana' }
		],
		[{ text: '❌Закрыть', callback_data: 'delete' }]
	]
})

export const stockKeyboard = JSON.stringify({
	inline_keyboard: [
		[
			{ text: 'Amazon', callback_data: 'investAmazon' },
			{ text: 'Tesla', callback_data: 'investTesla' }
		],
		[
			{ text: 'Apple', callback_data: 'investApple' },
			{ text: 'Google', callback_data: 'investGoogle' }
		],
		[{ text: '❌Закрыть', callback_data: 'delete' }]
	]
})

export const tradeKeyboard = JSON.stringify({
	inline_keyboard: [
		[{ text: '📈Поставить на повышение', callback_data: 'trade' }],
		[{ text: '📉Поставить на понижение', callback_data: 'trade' }],
		[{ text: '❌Закрыть', callback_data: 'delete' }]
	]
})

export const tradeTimeKeyboard = JSON.stringify({
	inline_keyboard: [
		[
			{ text: '⏰10', callback_data: '10sec' },
			{ text: '⏰30', callback_data: '30sec' },
			{ text: '⏰60', callback_data: '60sec' }
		],
		[{ text: '❌Закрыть', callback_data: 'doubleDelete' }]
	]
})

export const dealKeyboard = JSON.stringify({
	inline_keyboard: [
		[{ text: '💵Кошелёк', callback_data: 'wallet' }],
		[{ text: '❌Закрыть', callback_data: 'delete' }]
	]
})

export const successWithdrawKeyboard = JSON.stringify({
	inline_keyboard: [
		[{ text: '💵Кошелёк', callback_data: 'wallet' }],
		[{ text: '❌Закрыть', callback_data: 'doubleDelete' }]
	]
})

