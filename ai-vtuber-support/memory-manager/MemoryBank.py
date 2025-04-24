'''
记忆的数据结构以及基础容器
'''
from typing import List
import json
import random

idFactory = 0
def uuid():
	global idFactory
	idFactory += 1
	return idFactory

class Memory(object):
	"""描述一条记忆"""
	def __init__(self, content: str, time: any, strength = 1.0, resilience = 0.5, memoryId = None):
		self.content = content
		self.time = time # 添加该条记忆的时间(其数值对记忆筛选并无影响，仅作为一个标记)
		self.strength = strength # 记忆的强度，决定该条记忆被回忆（recall）的概率
		self.resilience = resilience # 记忆的人性，决定该条记忆被遗忘的速率
		
		if memoryId is None:
			memoryId = uuid()
		self.id = memoryId

	# def __str__(self):
		# return f'<Memory id={self.id} content="{self.content.replace('\n', '\\n').replace('"', '\\"')}", time={self.time}, strength={self.strength}>'

	def __str__(self):
		return f'<Memory id={self.id} content="{str(self.content).replace('\n', '\\n').replace('"', '\\"')}">'

	def toDict(self):
		return {'id': self.id, 'content': self.content, 'time': self.time, 'strength': self.strength, 'resilience': self.resilience}

	def reinforce(self):
		self.strength = 1.0
		self.resilience = 2.0 / ((1.0 / self.resilience) + 1.0) # 保证resilience始终保持在0~1之间

		if self.resilience > 1.0:
			self.resilience = 1.0
		elif self.resilience < 0.0:
			self.resilience = 0.0

	def fade(self, removeThreshold=0.1):
		self.strength *= self.resilience
		if self.strength < removeThreshold:
			self.strength = 0

class MemoryBank(object):
	"""一组记忆"""
	def __init__(self):
		self.memoryIdList: List[int] = []
		self.memoryDict = {}

	def __iter__(self):
		for memory in self.memoryDict.values():
			yield memory

	def __len__(self):
		return len(self.memoryIdList)

	def __str__(self):
		if len(self) == 0:
			return '<MemoryBank []>'
		string = '<MemoryBank ['
		for memory in self:
			string += '\n\t' + str(memory)
		string += '\n]>'
		return string

	def getMemoryById(self, memoryId: int) -> Memory:
		'''
		根据Id来获取Bank中的某一条Memory
		'''
		if memoryId not in self.memoryDict.keys():
			raise KeyError(f'Memory with id {memoryId} does not exist.')
		return self.memoryDict[memoryId]

	def add(self, memory: Memory):
		'''
		将一条Memory添加到Bank中
		'''
		if not isinstance(memory, Memory):
			raise TypeError(f'Only objects with type "Memory" can be added into MemoryBank.\n(Got type {type(memory)})')
		self.memoryDict[memory.id] = memory
		self.memoryIdList.append(memory.id)

	def remove(self, memoryId: int) -> Memory:
		'''
		移除一条Memory
		'''
		memory = self.getMemoryById(memoryId)
		self.memoryIdList.pop(self.memoryIdList.index(memoryId))
		del self.memoryDict[memoryId]
		return memory

	def update(self, recalledMemoryIds: List[int]):
		'''
		根据此次回忆到的MemoryIds，来更新每个memory的strength，并删除应当被遗忘的memory
		'''
		for memoryId in self.memoryIdList:
			if memoryId in recalledMemoryIds:
				self.getMemoryById(memoryId).reinforce()
			else:
				memory = self.getMemoryById(memoryId)
				memory.fade()
				if memory.strength < 0.1:
					self.remove(memoryId)

	def toJSON(self):
		# string = ''
		# for m in self:
		# 	string += f'{{"id":{m.id},"content":"{m.content}","time":"{m.time}","strength":{m.strength}}},'
		# string = f'[{string[:-1]}]'
		# return string
		return json.dumps([m.toDict() for m in self])

	def recallJSON(self):
		result = []
		for m in self:
			if random.random() < m.strength:
				result.append(m)
		return json.dumps([m.toDict() for m in result])

	def save(self, filename):
		'''
		保存到文件
		'''
		with open(filename, 'w') as f:
			f.write(self.toJSON())

	def load(self, filename):
		'''
		从文件导入
		'''
		global idFactory
		memoryList = []

		with open(filename, 'r') as f:
			try:
				memoryList = json.loads(f.read())
			except json.decoder.JSONDecodeError as e:
				print(f'[Warn] MemoryBank: An error occurred when parsing JSON file "{filename}"')
				return

		self.__init__()
		for m in memoryList:
			self.add(Memory(content=m['content'], time=m['time'], strength=m['strength'], resilience=m['resilience'], memoryId=m['id']))
			if idFactory < m['id']:
				idFactory = m['id']

def test():
	bank = MemoryBank()
	bank.add(Memory('你好呀', 1, 3.0))
	bank.add(Memory('你在干什么', 2, 0.5))
	bank.getMemoryById(1).reinforce()
	bank.getMemoryById(2).fade()
	# print(bank.remove(1))
	print(bank)
	print(bank.toJSON())
	bank.save('test.json')
	bank = MemoryBank()
	bank.load('test.json')

if __name__ == '__main__':
	test()