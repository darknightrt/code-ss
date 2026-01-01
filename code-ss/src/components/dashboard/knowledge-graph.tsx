'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MOCK_GRAPH_DATA } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useStore();

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = 300;
    const data = JSON.parse(JSON.stringify(MOCK_GRAPH_DATA));

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const isMatrix = theme === 'matrix';

    const color = isMatrix
      ? d3.scaleOrdinal(['#00ff41', '#00cc33', '#008F11', '#003b00', '#ccffcc'])
      : d3.scaleOrdinal(d3.schemeCategory10);

    const linkColor = isMatrix ? '#003300' : theme === 'dark' ? '#475569' : '#cbd5e1';
    const textColor = isMatrix ? '#00ff41' : theme === 'dark' ? '#e2e8f0' : '#1e293b';
    const nodeStroke = isMatrix ? '#00ff41' : '#fff';

    const simulation = d3
      .forceSimulation(data.nodes)
      .force(
        'link',
        d3.forceLink(data.links).id((d: any) => d.id).distance(80)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append('g')
      .attr('stroke', linkColor)
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value));

    const node = svg
      .append('g')
      .attr('stroke', nodeStroke)
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d: any) => color(d.group))
      .attr('fill-opacity', isMatrix ? 0.8 : 1);

    const labels = svg
      .append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text((d: any) => d.id)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', 4)
      .attr('fill', textColor)
      .style('text-shadow', isMatrix ? '0 0 4px rgba(0,255,65,0.5)' : 'none');

    node.append('title').text((d: any) => d.id);

    const drag = (simulation: any) => {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    };

    node.call(drag(simulation) as any);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      labels.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [theme]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">知识图谱</CardTitle>
        <span className="text-xs text-muted-foreground">动态关联</span>
      </CardHeader>
      <CardContent className="p-0">
        <svg ref={svgRef} className="w-full" style={{ height: '435px' }} />
      </CardContent>
    </Card>
  );
}
