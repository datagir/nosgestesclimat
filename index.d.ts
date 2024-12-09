import { Evaluation, Rule, RuleNode, Situation } from 'publicodes'

import { DottedName } from './types/dottedNames'
export { DottedName } from './types/dottedNames'

export type NGCRuleNode = RuleNode & {
  rawNode: NGCRule
}

export type NGCRulesNodes = Record<DottedName, NGCRuleNode>

export type NodeValue = Evaluation

export type SuggestionValue = 'oui' | 'non' | number

export type Suggestions = Record<
  string,
  SuggestionValue | Record<string, SuggestionValue>
>

export type SuggestionType = 'radio' | 'checkbox' | 'multiple'

export type MosaiqueNode = {
  type: 'selection' | 'nombre'
  options: DottedName[]
  suggestions?: Suggestions
}

export type MosaicInfos = {
  mosaicRule: RuleNode
  mosaicParams: MosaiqueNode
  mosaicDottedNames: [DottedName, NGCRuleNode][]
}

export type MigrationType = {
  keysToMigrate: Record<DottedName, DottedName>
  valuesToMigrate: Record<DottedName, Record<string, NodeValue>>
}

export type Persona = {
  nom: string
  description: string
  icônes: string
  résumé?: string
  situation: Situation<DottedName>
}

export type Personas = Record<string, Persona>

export type migrationType = {
  keysToMigrate: Record<DottedName, DottedName>
  valuesToMigrate: Record<DottedName, Record<string, NodeValue>>
}

export type RegionAuthor = {
  nom: string
  url?: string
}

export type RegionCode = string

export type RegionParams = {
  code: RegionCode
  nom: string
  gentilé: string
  authors?: RegionAuthor[]
  drapeau?: string
}

export type SupportedRegion = Record<string, RegionParams>

export type SupportedRegions = Record<RegionCode, SupportedRegion>

export type NGCRule = Omit<
  Rule,
  'formule' | 'question' | 'références' | 'valeur'
> & {
  formule?: Rule['formule'] | number
  question?: Rule['question'] | null
  références?: Rule['références'] | string[]
  valeur?: Rule['valeur'] | number
  abréviation?: string
  mosaique?: MosaiqueNode
  type?: string
  action?: { dépasse: string[] }
  icônes?: string
  sévérité?: string
  dottedName?: DottedName
  plus?: boolean
  aide?: string
  inactif?: string
  résumé?: string
  plancher?: number
  avertissement?: string
  'type suggestion'?: SuggestionType
}

export type Metrics = 'carbone' | 'eau'

export type NGCRules = Record<DottedName, NGCRule>

export type FunFacts = {
  percentageOfBicycleUsers: number
  percentageOfVegetarians: number
  percentageOfCarOwners: number
  percentageOfPlaneUsers: number
  percentageOfLongPlaneUsers: number
  averageOfCarKilometers: number
  averageOfTravelers: number
  percentageOfElectricHeating: number
  percentageOfGasHeating: number
  percentageOfFuelHeating: number
  percentageOfWoodHeating: number
  averageOfElectricityConsumption: number
  percentageOfCoolingSystem: number
  percentageOfVegan: number
  percentageOfRedMeat: number
  percentageOfLocalAndSeasonal: number
  percentageOfBottledWater: number
  percentageOfZeroWaste: number
  amountOfClothing: number
  percentageOfStreaming: number
}
