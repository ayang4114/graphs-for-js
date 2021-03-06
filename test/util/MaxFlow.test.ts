import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { Graph } from '../../index'
import { findMaxFlow } from '../../src/util/MaxFlow'
import range from '../common/range'
import { MutableWeightedGraph, ReadonlyWeightedGraph } from '../../src/types/GraphSystem'

const GraphUtil = {
  findMaxFlow
}

const repOkFlowGraph = <V> (
  g: ReadonlyWeightedGraph<V, number>,
  source: V,
  sink: V,
  flow: number
) => {
  for (const n of g.nodes()) {
    const out = g.outgoingEdgesOf(n)
    const incoming = g.incomingEdgesOf(n)
    const outFlow = out.reduce((p, { value }) => p + value, 0)
    const inFlow = incoming.reduce((p, { value }) => p + value, 0)
    if (g.toKeyFn(n) === g.toKeyFn(source)) {
      expect(outFlow).equals(flow)
    } else if (g.toKeyFn(n) === g.toKeyFn(sink)) {
      expect(inFlow).equals(flow)
    } else {
      expect(outFlow).equals(inFlow)
    }
  }
}

describe('Test suite for min max flow', function () {
  describe('Max flow', function () {
    describe('Undirected', function () {
      let graph: MutableWeightedGraph<number, number>
      beforeEach(() => {
        graph = new Graph<number, number>().noKey().undirected.weighted()
      })
      it('should satisfy self loop', function () {
        graph.insert(1)
        graph.connect(1, 1, 2)
        let result = GraphUtil.findMaxFlow(graph, 1, 1)
        expect(result).is.not.undefined
        result = result!
        expect(result.flow).equals(0)
        repOkFlowGraph(result.flowGraph, 1, 1, 0)
      })

      it('should solve basic flow', function () {
        graph.insert(1, 2, 3, 4, 5)
        graph.connect(1, 2, 4)
        graph.connect(1, 3, 5)
        graph.connect(1, 4, 6)
        graph.connect(2, 5, 5)
        graph.connect(3, 5, 5)
        graph.connect(4, 5, 5)
        const result = GraphUtil.findMaxFlow(graph, 1, 5)
        expect(result).is.not.undefined
        const { flowGraph, flow } = result!
        expect(flow).equals(14)
        repOkFlowGraph(flowGraph, 1, 5, flow)
      })

      it('should handle circular loop', function () {
        graph.insert(1, 2, 3, 4)
        graph.connect(1, 2, 5)
        graph.connect(2, 3, 5)
        graph.connect(3, 4, 100)
        graph.connect(4, 1, 100)
        const result = GraphUtil.findMaxFlow(graph, 1, 4)
        expect(result).is.not.undefined
        const { flowGraph, flow } = result!
        expect(flow).equals(105)
        repOkFlowGraph(flowGraph, 1, 4, flow)
      })

      it('should handle undirected version of [https://en.wikipedia.org/wiki/Edmonds%E2%80%93Karp_algorithm]', function () {
        graph.insert(...range.number(1, 7))
        graph.connect(1, 4, 3)
        graph.connect(4, 6, 6)
        graph.connect(6, 7, 9)
        graph.connect(1, 2, 3)
        graph.connect(4, 5, 2)
        graph.connect(5, 2, 1)
        graph.connect(5, 7, 1)
        graph.connect(3, 1, 3)
        graph.connect(2, 3, 4)
        graph.connect(3, 4, 1)
        graph.connect(3, 5, 2)

        const result = GraphUtil.findMaxFlow(graph, 1, 7)
        expect(result).is.not.undefined
        const { flowGraph, flow } = result!
        expect(flow).equals(7)
        repOkFlowGraph(flowGraph, 1, 7, flow)
      })
    })

    describe('Directed', function () {
      let graph: MutableWeightedGraph<string, number>
      beforeEach(() => {
        graph = new Graph<string, number>()
          .noKey().directed.weighted()
      })
      it('should return undefined when there is an edge with 0 capacity.', function () {
        graph.insert('A', 'B', 'C')
        graph.connect('A', 'B', 4)
        graph.connect('B', 'C', 0)
        const result = GraphUtil.findMaxFlow(graph, 'A', 'C')
        expect(result).to.not.be.undefined
        const { flow, flowGraph } = result!
        expect(flow).equals(0)
        repOkFlowGraph(flowGraph, 'A', 'C', flow)
      })
      it('should satisfy empty', function () {
        const result = GraphUtil.findMaxFlow(graph, 'A', 'G')
        expect(result).to.be.undefined
      })
      it('should solve basic flow', function () {
        graph.insert('A', 'B', 'C', 'D', 'E')
        graph.connect('A', 'B', 4)
        graph.connect('A', 'C', 5)
        graph.connect('A', 'D', 6)
        graph.connect('B', 'E', 5)
        graph.connect('C', 'E', 5)
        graph.connect('D', 'E', 5)
        const result = GraphUtil.findMaxFlow(graph, 'A', 'E')
        expect(result).is.not.undefined
        const { flowGraph, flow } = result!
        expect(flow).equals(14)
        repOkFlowGraph(flowGraph, 'A', 'E', flow)
      })
      it('should satisfy unreachable', function () {
        graph.insert('A', 'G')
        const result = GraphUtil.findMaxFlow(graph, 'A', 'G')
        expect(result).to.be.undefined
      })
      it('should satisfy self node', function () {
        graph.insert('A')
        let result = GraphUtil.findMaxFlow(graph, 'A', 'A')
        expect(result).to.not.be.undefined
        result = result!
        expect(result.flow).equals(0)
        repOkFlowGraph(result.flowGraph, 'A', 'A', result.flow)
      })
      it('should satisfy example [src: https://en.wikipedia.org/wiki/Edmonds%E2%80%93Karp_algorithm]', function () {
        graph.insert(...range.char('A', 'G'))
        graph.connect('A', 'D', 3)
        graph.connect('D', 'F', 6)
        graph.connect('F', 'G', 9)
        graph.connect('A', 'B', 3)
        graph.connect('D', 'E', 2)
        graph.connect('E', 'B', 1)
        graph.connect('E', 'G', 1)
        graph.connect('C', 'A', 3)
        graph.connect('B', 'C', 4)
        graph.connect('C', 'D', 1)
        graph.connect('C', 'E', 2)

        let result = GraphUtil.findMaxFlow(graph, 'A', 'G')
        expect(result).is.not.undefined
        result = result!
        expect(result.flow).equals(5)
        repOkFlowGraph(result.flowGraph, 'A', 'G', result.flow)
      })
      it('should satisfy example [https://cp-algorithms.com/graph/edmonds_karp.html#integral-theorem]', function () {
        graph.insert(...range.char('A', 'D'), 's', 't')
        graph.connect('s', 'A', 7)
        graph.connect('s', 'D', 4)
        graph.connect('A', 'B', 5)
        graph.connect('A', 'C', 3)
        graph.connect('D', 'A', 3)
        graph.connect('D', 'C', 2)
        graph.connect('C', 'B', 3)
        graph.connect('B', 't', 8)
        graph.connect('C', 't', 5)

        let result = GraphUtil.findMaxFlow(graph, 's', 't')
        expect(result).is.not.undefined
        result = result!
        expect(result.flow).equals(10)
        repOkFlowGraph(result.flowGraph, 's', 't', result.flow)
      })
    })
  })
})
